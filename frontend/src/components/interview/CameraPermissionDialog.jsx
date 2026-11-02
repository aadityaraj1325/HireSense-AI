import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  ShieldCheck,
  Video,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  X,
} from "lucide-react";
import { InterviewMediaManager } from "@/services/interviewMediaManager";
import { cn } from "@/lib/utils";

export function CameraPermissionDialog({
  isOpen,
  onClose,
  onConfirmStart,
  targetRole,
  isInitializing = false,
}) {
  const [permissionState, setPermissionState] = useState("prompt"); // "prompt" | "granted" | "denied"
  const [errorMessage, setErrorMessage] = useState(null);

  const [stream, setStream] = useState(null);
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [selectedAudioId, setSelectedAudioId] = useState("");

  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cleanupAudioRef = useRef(null);

  // Request permissions & initialize preview stream
  const initializeDevices = async (videoId = null, audioId = null) => {
    setErrorMessage(null);
    try {
      if (streamRef.current) {
        InterviewMediaManager.stopStream(streamRef.current);
        streamRef.current = null;
      }
      if (cleanupAudioRef.current) {
        cleanupAudioRef.current();
        cleanupAudioRef.current = null;
      }

      const newStream = await InterviewMediaManager.acquireStream({
        video: true,
        audio: true,
        videoDeviceId: videoId || selectedVideoId || null,
        audioDeviceId: audioId || selectedAudioId || null,
      });

      streamRef.current = newStream;
      setStream(newStream);
      setPermissionState("granted");

      // Attach video preview immediately if video node is in DOM
      if (videoRef.current) {
        const v = videoRef.current;
        v.muted = true;
        v.defaultMuted = true;
        v.playsInline = true;
        v.setAttribute("muted", "");
        v.setAttribute("playsinline", "");
        v.setAttribute("autoplay", "");
        v.srcObject = newStream;
        v.onloadedmetadata = () => {
          v.play().catch(() => {});
        };
        v.play().catch(() => {});
      }

      // Enumerate available devices
      const { videoDevices: vDevs, audioDevices: aDevs } =
        await InterviewMediaManager.enumerateDevices();
      setVideoDevices(vDevs);
      setAudioDevices(aDevs);

      if (!selectedVideoId && vDevs.length > 0) {
        setSelectedVideoId(vDevs[0].deviceId);
      }
      if (!selectedAudioId && aDevs.length > 0) {
        setSelectedAudioId(aDevs[0].deviceId);
      }

      // Attach live audio meter
      cleanupAudioRef.current = InterviewMediaManager.createAudioMeter(
        newStream,
        (lvl) => setAudioLevel(lvl)
      );
    } catch (err) {
      console.warn("Device permission / init error:", err);
      setPermissionState("denied");
      setErrorMessage(err.message || "Failed to access camera and microphone.");
    }
  };

  // Reliably attach and play stream whenever stream, cameraEnabled, or permissionState changes
  useEffect(() => {
    const video = videoRef.current;
    if (video && stream && cameraEnabled && permissionState === "granted") {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("autoplay", "");
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.onloadedmetadata = () => {
        video.play().catch((err) => console.warn("Video metadata play notice:", err));
      };
      video.play().catch((err) => console.warn("Video play notice:", err));
    }
  }, [stream, cameraEnabled, permissionState]);

  useEffect(() => {
    if (isOpen) {
      initializeDevices();
    } else {
      // Clean up when modal closes
      if (streamRef.current) {
        InterviewMediaManager.stopStream(streamRef.current);
        streamRef.current = null;
        setStream(null);
      }
      if (cleanupAudioRef.current) {
        cleanupAudioRef.current();
        cleanupAudioRef.current = null;
      }
    }
    return () => {
      if (streamRef.current) {
        InterviewMediaManager.stopStream(streamRef.current);
        streamRef.current = null;
      }
      if (cleanupAudioRef.current) {
        cleanupAudioRef.current();
        cleanupAudioRef.current = null;
      }
    };
  }, [isOpen]);

  const handleDeviceChange = (type, deviceId) => {
    if (type === "video") {
      setSelectedVideoId(deviceId);
      initializeDevices(deviceId, selectedAudioId);
    } else {
      setSelectedAudioId(deviceId);
      initializeDevices(selectedVideoId, deviceId);
    }
  };

  const toggleCamera = () => {
    const next = !cameraEnabled;
    setCameraEnabled(next);
    InterviewMediaManager.setTrackEnabled(stream, "video", next);
  };

  const toggleMic = () => {
    const next = !micEnabled;
    setMicEnabled(next);
    InterviewMediaManager.setTrackEnabled(stream, "audio", next);
  };

  const handleProceed = () => {
    onConfirmStart({
      videoDeviceId: selectedVideoId,
      audioDeviceId: selectedAudioId,
      cameraEnabled,
      micEnabled,
      stream,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)] border border-[var(--accent)]/30">
              <Camera size={18} />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-[var(--ink)]">
                Camera & Audio Pre-Flight Check
              </h2>
              <p className="text-xs text-[var(--ink-muted)]">
                Verify your devices before entering the Live Interview Studio
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Privacy Disclaimer Banner */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={18} className="shrink-0 mt-0.5 text-emerald-500" />
            <div className="space-y-0.5">
              <span className="font-semibold block text-[var(--ink)]">Privacy-Preserving On-Device Verification</span>
              <p className="text-[11px] leading-relaxed text-[var(--ink-muted)]">
                Video and audio streams are processed locally in your browser for live preview and presence detection. No video is ever recorded, stored on servers, or sent to external AI.
              </p>
            </div>
          </div>

          {/* Video Preview Box */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-[var(--border)] flex items-center justify-center shadow-inner group">
            <video
              ref={(node) => {
                videoRef.current = node;
                if (node && stream && cameraEnabled && permissionState === "granted") {
                  node.muted = true;
                  node.defaultMuted = true;
                  node.playsInline = true;
                  node.setAttribute("muted", "");
                  node.setAttribute("playsinline", "");
                  node.setAttribute("autoplay", "");
                  if (node.srcObject !== stream) {
                    node.srcObject = stream;
                  }
                  node.play().catch(() => {});
                }
              }}
              autoPlay
              playsInline
              muted
              className={cn(
                "w-full h-full object-cover transform -scale-x-100",
                (!cameraEnabled || permissionState !== "granted") && "hidden"
              )}
            />

            {(!cameraEnabled || permissionState !== "granted") && (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-2 text-gray-400">
                <CameraOff size={36} className="text-gray-500" />
                <div className="text-sm font-semibold">Camera is Turned Off</div>
                <p className="text-xs max-w-xs text-gray-500">
                  {permissionState === "denied"
                    ? errorMessage
                    : "You can toggle your camera on using the control button below."}
                </p>
              </div>
            )}

            {/* LIVE Badge */}
            {permissionState === "granted" && cameraEnabled && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Camera Preview Live</span>
              </div>
            )}

            {/* Bottom Overlay Controls */}
            {permissionState === "granted" && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 text-white">
                <button
                  type="button"
                  onClick={toggleCamera}
                  title={cameraEnabled ? "Turn camera off" : "Turn camera on"}
                  className={cn(
                    "p-2 rounded-xl transition-all cursor-pointer",
                    cameraEnabled ? "bg-white/20 hover:bg-white/30 text-white" : "bg-rose-500 text-white"
                  )}
                >
                  {cameraEnabled ? <Camera size={16} /> : <CameraOff size={16} />}
                </button>

                <button
                  type="button"
                  onClick={toggleMic}
                  title={micEnabled ? "Mute microphone" : "Unmute microphone"}
                  className={cn(
                    "p-2 rounded-xl transition-all cursor-pointer",
                    micEnabled ? "bg-white/20 hover:bg-white/30 text-white" : "bg-rose-500 text-white"
                  )}
                >
                  {micEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                </button>
              </div>
            )}
          </div>

          {/* Audio Input Level Meter */}
          <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink)]">
              <span className="flex items-center gap-1.5">
                <Mic size={14} className={cn(micEnabled ? "text-emerald-500" : "text-rose-500")} />
                <span>Microphone Volume Level (Speak to test)</span>
              </span>
              <span className="text-[11px] font-mono text-[var(--ink-muted)]">{audioLevel}%</span>
            </div>
            <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-75",
                  audioLevel > 15 ? "bg-emerald-500" : "bg-[var(--accent)]"
                )}
                style={{ width: `${Math.min(100, audioLevel * 1.5)}%` }}
              />
            </div>
          </div>

          {/* Device Selection Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-[var(--ink)]">Camera Device</label>
              <select
                value={selectedVideoId}
                onChange={(e) => handleDeviceChange("video", e.target.value)}
                disabled={videoDevices.length === 0}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                {videoDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-[var(--ink)]">Microphone Device</label>
              <select
                value={selectedAudioId}
                onChange={(e) => handleDeviceChange("audio", e.target.value)}
                disabled={audioDevices.length === 0}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                {audioDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Permission Denied Alert & Retry */}
          {permissionState === "denied" && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage || "Permissions were denied. Please allow camera and microphone."}</span>
              </div>
              <button
                type="button"
                onClick={() => initializeDevices()}
                className="px-3 py-1.5 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-colors shrink-0 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-2)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleProceed}
            disabled={isInitializing || permissionState === "denied"}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer",
              permissionState === "granted"
                ? "bg-[var(--ink)] text-[var(--bg)] hover:opacity-90 active:scale-95"
                : "bg-[var(--surface-2)] text-[var(--ink-muted)] opacity-50 cursor-not-allowed"
            )}
          >
            <Sparkles size={14} />
            <span>{isInitializing ? "Entering Studio..." : "Enter Live Interview Studio"}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

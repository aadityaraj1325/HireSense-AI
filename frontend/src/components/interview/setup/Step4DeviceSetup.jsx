import { useEffect, useState, useRef, useCallback } from "react";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Video,
  Volume2,
  Eye,
  Shield,
  HelpCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InterviewMediaManager } from "@/services/interviewMediaManager";
import { VisualMonitoringService } from "@/services/visualMonitoringService";

export function Step4DeviceSetup({
  onDevicesReady,
  deviceStatus,
  setDeviceStatus,
}) {
  const [stream, setStream] = useState(null);
  const [permissionState, setPermissionState] = useState("prompt"); // prompt | granted | denied
  const [errorMsg, setErrorMsg] = useState("");
  const [availableVideo, setAvailableVideo] = useState([]);
  const [availableAudio, setAvailableAudio] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [selectedAudioId, setSelectedAudioId] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [facePresence, setFacePresence] = useState({
    detected: false,
    label: "Scanning face presence...",
  });

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioCleanupRef = useRef(null);
  const visualMonitorRef = useRef(null);

  // Set video source ref callback to avoid black preview bug
  const setVideoRef = useCallback((node) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.muted = true;
      node.defaultMuted = true;
      node.playsInline = true;
      node.setAttribute("muted", "");
      node.setAttribute("playsinline", "");
      node.setAttribute("autoplay", "");
      if (node.srcObject !== streamRef.current) {
        node.srcObject = streamRef.current;
      }
      node.play().catch(() => {});
    }
  }, []);

  // Request permissions and initialize devices
  const requestMediaAccess = useCallback(async (videoId = selectedVideoId, audioId = selectedAudioId) => {
    try {
      setErrorMsg("");
      if (streamRef.current) {
        InterviewMediaManager.stopStream(streamRef.current);
        streamRef.current = null;
      }

      const acquired = await InterviewMediaManager.acquireStream({
        video: true,
        audio: true,
        videoDeviceId: videoId || undefined,
        audioDeviceId: audioId || undefined,
      });

      streamRef.current = acquired;
      setStream(acquired);
      setPermissionState("granted");

      // Bind to video node
      if (videoRef.current) {
        const v = videoRef.current;
        v.muted = true;
        v.defaultMuted = true;
        v.playsInline = true;
        v.setAttribute("muted", "");
        v.setAttribute("playsinline", "");
        v.setAttribute("autoplay", "");
        v.srcObject = acquired;
        v.play().catch(() => {});
      }

      // Enumerate available devices
      const { videoDevices, audioDevices } = await InterviewMediaManager.enumerateDevices();
      setAvailableVideo(videoDevices);
      setAvailableAudio(audioDevices);

      // Create live audio volume meter
      if (audioCleanupRef.current) audioCleanupRef.current();
      audioCleanupRef.current = InterviewMediaManager.createAudioMeter(acquired, (lvl) => {
        setAudioLevel(lvl);
      });

      // Start visual presence monitor
      if (visualMonitorRef.current) visualMonitorRef.current.stopMonitoring();
      const monitor = new VisualMonitoringService({
        detectionIntervalMs: 1200,
        onStatusChange: (status) => {
          setFacePresence({
            detected: status.status === "normal",
            label: status.label || "Candidate present",
          });
        },
      });
      visualMonitorRef.current = monitor;

      if (videoRef.current) {
        monitor.startMonitoring(videoRef.current);
      }

      setDeviceStatus((prev) => ({
        ...prev,
        cameraGranted: true,
        micGranted: true,
      }));
    } catch (err) {
      console.warn("Device acquisition error:", err);
      setPermissionState("denied");
      setErrorMsg(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera or microphone permission was denied. Please allow access in your browser address bar."
          : err.message || "Failed to access camera or microphone devices."
      );
      setDeviceStatus((prev) => ({
        ...prev,
        cameraGranted: false,
        micGranted: false,
      }));
    }
  }, [selectedVideoId, selectedAudioId, setDeviceStatus]);

  // Switch video device
  const handleSelectVideo = async (deviceId) => {
    setSelectedVideoId(deviceId);
    if (streamRef.current) {
      InterviewMediaManager.stopStream(streamRef.current);
      streamRef.current = null;
    }
    await requestMediaAccess(deviceId, selectedAudioId);
  };

  // Switch audio device
  const handleSelectAudio = async (deviceId) => {
    setSelectedAudioId(deviceId);
    if (streamRef.current) {
      InterviewMediaManager.stopStream(streamRef.current);
      streamRef.current = null;
    }
    await requestMediaAccess(selectedVideoId, deviceId);
  };

  useEffect(() => {
    requestMediaAccess();

    return () => {
      if (audioCleanupRef.current) audioCleanupRef.current();
      if (visualMonitorRef.current) visualMonitorRef.current.stopMonitoring();
      if (streamRef.current) {
        InterviewMediaManager.stopStream(streamRef.current);
        streamRef.current = null;
      }
    };
  }, []);

  // Update parent when ready
  useEffect(() => {
    const isReady = permissionState === "granted" && !!stream;
    if (onDevicesReady) {
      onDevicesReady(isReady);
    }
  }, [permissionState, stream, onDevicesReady]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-strong)]">
          Step 4 • Candidate Environment
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--ink)] mt-0.5">
          Candidate Identity & Device Setup
        </h2>
        <p className="text-sm text-[var(--ink-muted)] mt-1">
          Verify your camera and microphone readiness. Video is monitored locally on your device for interview presence; no raw video is stored or transmitted.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Video Preview Viewport (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-zinc-950 border border-[var(--border)] shadow-xl flex items-center justify-center">
            {/* The Candidate Live Video Stream */}
            <video
              ref={setVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${
                permissionState === "granted" ? "block" : "hidden"
              }`}
            />

            {/* Prompt / Denied Overlays */}
            {permissionState === "prompt" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-zinc-900/90 text-white">
                <Camera size={44} className="text-[var(--accent)] mb-3 animate-pulse" />
                <h3 className="text-base font-bold">Camera & Mic Access Required</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                  Click below to grant your browser permission to access your webcam and microphone.
                </p>
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  onClick={() => requestMediaAccess()}
                  className="mt-4"
                >
                  Enable Camera & Mic
                </Button>
              </div>
            )}

            {permissionState === "denied" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-red-950/80 text-white">
                <AlertCircle size={44} className="text-red-400 mb-2" />
                <h3 className="text-base font-bold">Permissions Blocked</h3>
                <p className="text-xs text-red-200 mt-1 max-w-sm leading-relaxed">
                  {errorMsg}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => requestMediaAccess()}
                  className="mt-4 bg-zinc-900 text-white border-zinc-700"
                >
                  <RefreshCw size={14} className="mr-1.5" /> Try Again
                </Button>
              </div>
            )}

            {/* Live Indicator Overlays */}
            {permissionState === "granted" && (
              <>
                <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Preview Active
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/10 text-[11px]">
                  <Eye size={12} className={facePresence.detected ? "text-emerald-400" : "text-amber-400"} />
                  <span className={facePresence.detected ? "text-emerald-300" : "text-amber-300"}>
                    {facePresence.detected ? "Face Centered" : "Scanning Face"}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Microphone Live Volume Level */}
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[var(--ink)]">
                <Mic size={14} className="text-[var(--accent-strong)]" />
                Microphone Input Level (Speak to test)
              </span>
              <span className="font-mono text-[var(--ink-muted)]">{Math.round(audioLevel)}%</span>
            </div>
            <div className="h-2 w-full bg-[var(--surface-2)] rounded-full overflow-hidden border border-[var(--border)]">
              <div
                className={`h-full transition-all duration-75 rounded-full ${
                  audioLevel > 15 ? "bg-emerald-500" : "bg-[var(--accent)]"
                }`}
                style={{ width: `${Math.min(100, audioLevel)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Device Selectors & Privacy Notice (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card padding="md" radius="lg" className="border border-[var(--border)] bg-[var(--surface)]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Video size={16} className="text-[var(--accent-strong)]" />
                Connected Hardware Devices
              </CardTitle>
              <CardDescription>Select your preferred camera and audio input.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              {/* Camera Selector */}
              <div>
                <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                  Camera Device
                </label>
                <select
                  value={selectedVideoId}
                  onChange={(e) => handleSelectVideo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  {availableVideo.length > 0 ? (
                    availableVideo.map((dev) => (
                      <option key={dev.deviceId} value={dev.deviceId}>
                        {dev.label || `Camera (${dev.deviceId.slice(0, 8)}...)`}
                      </option>
                    ))
                  ) : (
                    <option value="">Default System Webcam</option>
                  )}
                </select>
              </div>

              {/* Microphone Selector */}
              <div>
                <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                  Microphone Device
                </label>
                <select
                  value={selectedAudioId}
                  onChange={(e) => handleSelectAudio(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  {availableAudio.length > 0 ? (
                    availableAudio.map((dev) => (
                      <option key={dev.deviceId} value={dev.deviceId}>
                        {dev.label || `Microphone (${dev.deviceId.slice(0, 8)}...)`}
                      </option>
                    ))
                  ) : (
                    <option value="">Default System Microphone</option>
                  )}
                </select>
              </div>

              {/* Device Status Checklist */}
              <div className="pt-2 border-t border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--ink-muted)]">Webcam Stream:</span>
                  {permissionState === "granted" ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={13} /> Active & Ready
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium">Pending Permission</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--ink-muted)]">Audio Input:</span>
                  {audioLevel > 5 ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={13} /> Audio Detected
                    </span>
                  ) : permissionState === "granted" ? (
                    <span className="text-[var(--ink-muted)]">Waiting for speech...</span>
                  ) : (
                    <span className="text-amber-600 font-medium">Pending Permission</span>
                  )}
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[11px] text-[var(--ink-muted)] leading-relaxed space-y-1">
                <div className="font-semibold text-[var(--ink)] flex items-center gap-1">
                  <Shield size={12} className="text-emerald-600" />
                  Privacy-First Visual Proctoring
                </div>
                <div>
                  Visual presence analysis executes 100% on-device in your browser using computer vision tasks. Your live video is never recorded or uploaded to remote cloud servers.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


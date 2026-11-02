import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  User,
  ShieldCheck,
  AlertTriangle,
  Users,
  Eye,
  RefreshCw,
  AlertOctagon,
  Flag,
  RotateCcw,
} from "lucide-react";
import { InterviewMediaManager } from "@/services/interviewMediaManager";
import { cn } from "@/lib/utils";

export function CandidateCameraPreview({
  stream,
  cameraActive,
  onToggleCamera,
  isMuted,
  onToggleMute,
  audioLevel = 0,
  presenceStatus = {},
  availableCameras = [],
  onSwitchCamera,
  candidateName = "Candidate",
  onVideoReady,
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Stable stream attachment to video DOM element
  useEffect(() => {
    const videoNode = videoRef.current;
    if (!videoNode || !stream || !cameraActive) return;

    try {
      videoNode.muted = true;
      videoNode.defaultMuted = true;
      videoNode.playsInline = true;
      videoNode.setAttribute("muted", "");
      videoNode.setAttribute("playsinline", "");
      videoNode.setAttribute("autoplay", "");

      if (videoNode.srcObject !== stream) {
        videoNode.srcObject = stream;
      }

      if (videoNode.paused) {
        const p = videoNode.play();
        if (p !== undefined) {
          p.then(() => setIsPlaying(true)).catch(() => {
            setTimeout(() => {
              if (videoNode && videoNode.paused) {
                videoNode.play().then(() => setIsPlaying(true)).catch(() => {});
              }
            }, 300);
          });
        }
      }

      if (onVideoReady) {
        onVideoReady(videoNode);
      }
    } catch (err) {
      console.warn("Camera preview stream binding notice:", err);
    }
  }, [stream, cameraActive, onVideoReady]);

  // Extract presence badge styles
  const getStatusBadge = () => {
    if (!cameraActive) {
      return {
        label: "Camera Off",
        icon: CameraOff,
        color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      };
    }

    switch (presenceStatus.status) {
      case "single_face":
        return {
          label: "Face Verified",
          icon: ShieldCheck,
          color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
        };
      case "head_turned":
        return {
          label: presenceStatus.isWarningActive
            ? `🚩 RED FLAG: ${presenceStatus.directionLabel || "Head Turned"} (${presenceStatus.warningCount || 1}/3)`
            : `⚠️ ${presenceStatus.directionLabel || "Head Turned"}`,
          icon: Flag,
          color: presenceStatus.isWarningActive
            ? "bg-red-500/30 text-red-400 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse font-bold"
            : "bg-amber-500/20 text-amber-400 border-amber-500/30 font-semibold",
        };
      case "no_face":
        return {
          label: presenceStatus.isWarningActive
            ? `🚩 RED FLAG: Face Absent (${presenceStatus.warningCount || 1}/3)`
            : presenceStatus.label || "No Face Detected",
          icon: Flag,
          color: "bg-red-500/30 text-red-400 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse font-bold",
        };
      case "multiple_faces":
        return {
          label: "Multiple Faces Detected",
          icon: Users,
          color: "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse",
        };
      default:
        return {
          label: "Monitoring Active",
          icon: Eye,
          color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        };
    }
  };

  const badge = getStatusBadge();
  const BadgeIcon = badge.icon;
  const isRedFlag =
    (presenceStatus.status === "no_face" || presenceStatus.status === "head_turned") &&
    presenceStatus.isWarningActive;

  return (
    <div
      onClick={() => {
        if (videoRef.current && videoRef.current.paused) {
          videoRef.current.play().catch(() => {});
        }
      }}
      className={cn(
        "relative aspect-[4/3] w-full rounded-3xl overflow-hidden bg-black/95 transition-all duration-300 flex items-center justify-center group cursor-pointer",
        isRedFlag
          ? "border-2 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.7)] animate-pulse"
          : "border border-[var(--border)] shadow-lg"
      )}
    >
      {/* Actual Candidate Live Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          "w-full h-full object-cover transform -scale-x-100",
          (!cameraActive || !stream) && "hidden"
        )}
      />

      {/* Fallback placeholder when camera is manually paused */}
      {(!cameraActive || !stream) && (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="h-16 w-16 rounded-3xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink-muted)] border border-[var(--border)]">
            <User size={32} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{candidateName}</div>
            <div className="text-xs text-gray-400 mt-0.5">Camera is turned off</div>
          </div>
        </div>
      )}

      {/* Top Left: LIVE Badge */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-[11px] font-bold">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          <span>LIVE</span>
        </div>

        {/* Presence Status Pill */}
        <div
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-md border text-[11px] font-semibold transition-all",
            badge.color
          )}
        >
          <BadgeIcon size={12} />
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Top Right: Mic & Audio Activity Indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <div
          className={cn(
            "h-7 w-7 rounded-full flex items-center justify-center backdrop-blur-md border transition-all",
            isMuted
              ? "bg-rose-500/80 border-rose-400 text-white"
              : "bg-black/60 border-white/15 text-emerald-400"
          )}
        >
          {isMuted ? <MicOff size={13} /> : <Mic size={13} />}
        </div>
      </div>

      {/* Audio Level Reactive Bar at the bottom of video */}
      <div className="absolute bottom-12 left-4 right-4 h-1 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full bg-emerald-400 transition-all duration-75"
          style={{ width: `${Math.min(100, audioLevel * 1.5)}%` }}
        />
      </div>

      {/* Bottom Floating Control Bar (Shows on Hover or Always Mobile) */}
      <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-md opacity-90 group-hover:opacity-100 transition-opacity">
        {/* Toggle Camera Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCamera?.();
          }}
          title={cameraActive ? "Turn off camera" : "Turn on camera"}
          className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center transition-all cursor-pointer",
            cameraActive
              ? "bg-white/10 hover:bg-white/20 text-white"
              : "bg-rose-500/80 hover:bg-rose-500 text-white"
          )}
        >
          {cameraActive ? <Camera size={15} /> : <CameraOff size={15} />}
        </button>

        {/* Toggle Mic Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute?.();
          }}
          title={isMuted ? "Unmute microphone" : "Mute microphone"}
          className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center transition-all cursor-pointer",
            !isMuted
              ? "bg-white/10 hover:bg-white/20 text-white"
              : "bg-rose-500/80 hover:bg-rose-500 text-white"
          )}
        >
          {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
        </button>

        {/* Camera Selector Switcher */}
        {availableCameras.length > 1 && (
          <select
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onSwitchCamera?.(e.target.value)}
            className="text-[10px] bg-black/60 text-white border border-white/20 rounded-lg px-2 py-1 max-w-[120px] truncate focus:outline-none cursor-pointer"
          >
            {availableCameras.map((cam) => (
              <option key={cam.deviceId} value={cam.deviceId} className="bg-zinc-900 text-white">
                {cam.label || "Camera"}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

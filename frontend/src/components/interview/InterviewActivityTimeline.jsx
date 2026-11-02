import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Users,
  Eye,
  CameraOff,
  Camera,
  ExternalLink,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function InterviewActivityTimeline({ events = [] }) {
  if (!events || events.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-[var(--ink-muted)]">
        No monitoring events recorded yet. Session telemetry is nominal.
      </div>
    );
  }

  const getEventMeta = (type) => {
    switch (type) {
      case "single_face":
      case "candidate_verified":
        return {
          icon: ShieldCheck,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        };
      case "face_absent":
        return {
          icon: AlertTriangle,
          color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        };
      case "multiple_faces":
        return {
          icon: Users,
          color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        };
      case "tab_hidden":
        return {
          icon: ExternalLink,
          color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
        };
      case "tab_restored":
        return {
          icon: Clock,
          color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        };
      case "camera_disabled":
        return {
          icon: CameraOff,
          color: "text-gray-500 bg-gray-500/10 border-gray-500/20",
        };
      case "camera_restored":
        return {
          icon: Camera,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        };
      default:
        return {
          icon: Eye,
          color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        };
    }
  };

  return (
    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
      {[...events].reverse().map((evt) => {
        const meta = getEventMeta(evt.eventType);
        const Icon = meta.icon;
        const timeStr = evt.timestamp
          ? new Date(evt.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          : "";

        return (
          <div
            key={evt.id}
            className="flex items-start gap-2.5 p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs"
          >
            <div className={cn("p-1.5 rounded-lg border shrink-0 mt-0.5", meta.color)}>
              <Icon size={12} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="font-semibold text-[var(--ink)] capitalize">
                  {(evt.eventType || "Event").replace(/_/g, " ")}
                </span>
                <span className="text-[10px] font-mono text-[var(--ink-muted)]">
                  {timeStr}
                </span>
              </div>
              <p className="text-[11px] text-[var(--ink-muted)] mt-0.5 leading-snug">
                {evt.note}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}


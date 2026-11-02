import React, { useState } from "react";
import {
  ShieldCheck,
  Eye,
  Activity,
  Mic,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { CandidateCameraPreview } from "./CandidateCameraPreview";
import { InterviewActivityTimeline } from "./InterviewActivityTimeline";
import { cn } from "@/lib/utils";

const CORE_SKILL_CATEGORIES = [
  { name: "Frontend & Architecture", key: "frontend" },
  { name: "Backend APIs & Microservices", key: "backend" },
  { name: "Databases & Indexing", key: "database" },
  { name: "System Design & Scaling", key: "system_design" },
  { name: "Project Defense & Trade-offs", key: "projects" },
];

export function LiveSessionSidebar({
  stream,
  cameraActive,
  onToggleCamera,
  isMuted,
  onToggleMute,
  audioLevel,
  presenceStatus,
  availableCameras,
  onSwitchCamera,
  candidateName,
  monitoringMetrics = {},
  events = [],
  formattedElapsed,
  activeTopic,
  questionsCount = 0,
  topicsCovered = [],
  onVideoReady,
}) {
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [skillMapExpanded, setSkillMapExpanded] = useState(true);

  const presencePct = monitoringMetrics.facePresencePct ?? 100;
  const tabSwitches = monitoringMetrics.totalTabSwitches ?? 0;
  const absentEvents = monitoringMetrics.totalAbsentEvents ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Live Candidate Camera Preview Window */}
      <CandidateCameraPreview
        stream={stream}
        cameraActive={cameraActive}
        onToggleCamera={onToggleCamera}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        audioLevel={audioLevel}
        presenceStatus={presenceStatus}
        availableCameras={availableCameras}
        onSwitchCamera={onSwitchCamera}
        candidateName={candidateName}
        onVideoReady={onVideoReady}
      />

      {/* 2. Candidate Presence & Session Metrics Card */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-card space-y-4">
        {/* Presence Gauges */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
            <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
              <span>Face Continuity</span>
              <ShieldCheck size={13} className="text-emerald-500" />
            </div>
            <div className="text-lg font-display font-bold text-[var(--ink)] mt-0.5">
              {presencePct}%
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
            <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
              <span>Elapsed Time</span>
              <Clock size={13} className="text-purple-500" />
            </div>
            <div className="text-lg font-display font-mono font-bold text-[var(--ink)] mt-0.5">
              {formattedElapsed || "00:00"}
            </div>
          </div>
        </div>

        {/* Telemetry Summary Stats */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/50 text-[var(--ink-muted)]">
            <span>Current Topic:</span>
            <span className="font-semibold text-[var(--ink)] truncate max-w-[140px]">
              {activeTopic || "Technical Deep-Dive"}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/50 text-[var(--ink-muted)]">
            <span>Questions Explored:</span>
            <span className="font-semibold text-[var(--ink)]">{questionsCount}</span>
          </div>

          <div className="flex items-center justify-between py-1 text-[var(--ink-muted)]">
            <span>Tab Switches / Absences:</span>
            <span className="font-semibold text-[var(--ink)]">
              {tabSwitches} / {absentEvents}
            </span>
          </div>
        </div>

        {/* 3. Skill Evidence & Live Coverage Map (Phase 9 A & E) */}
        <div className="pt-2 border-t border-[var(--border)] space-y-2">
          <button
            type="button"
            onClick={() => setSkillMapExpanded((prev) => !prev)}
            className="w-full flex items-center justify-between text-xs font-semibold text-[var(--ink)] hover:text-[var(--accent)] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <BarChart3 size={13} className="text-[var(--accent-strong)]" />
              <span>Skill Evidence Map</span>
            </div>
            {skillMapExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {skillMapExpanded && (
            <div className="space-y-2 pt-1">
              {CORE_SKILL_CATEGORIES.map((cat, idx) => {
                // Category is tested if questionsCount covers it
                const isTested = idx < questionsCount;
                return (
                  <div
                    key={cat.key}
                    className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface-2)] text-[11px]"
                  >
                    <span className="font-medium text-[var(--ink)]">{cat.name}</span>
                    {isTested ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[10px]">
                        <CheckCircle2 size={12} /> Demonstrated
                      </span>
                    ) : idx === questionsCount ? (
                      <span className="text-[var(--accent-strong)] font-semibold text-[10px] animate-pulse">
                        ● In Progress
                      </span>
                    ) : (
                      <span className="text-[var(--ink-muted)] text-[10px]">Upcoming</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Real-Time Activity Monitoring Timeline */}
        <div className="pt-2 border-t border-[var(--border)] space-y-2">
          <button
            type="button"
            onClick={() => setTimelineExpanded((prev) => !prev)}
            className="w-full flex items-center justify-between text-xs font-semibold text-[var(--ink)] hover:text-[var(--accent)] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <Activity size={13} className="text-[var(--accent)]" />
              <span>Smart Monitoring Log ({events.length})</span>
            </div>
            {timelineExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {timelineExpanded && <InterviewActivityTimeline events={events} />}
        </div>
      </div>
    </div>
  );
}

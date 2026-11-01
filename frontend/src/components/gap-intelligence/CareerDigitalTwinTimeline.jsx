import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  FolderGit2,
  Award,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export default function CareerDigitalTwinTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <Clock size={24} className="mx-auto text-[var(--ink-muted)] mb-2" />
        <h4 className="text-sm font-semibold text-[var(--ink)]">No timeline events yet</h4>
        <p className="text-xs text-[var(--ink-muted)] mt-1">
          As you submit code artifacts, sync platforms, and bridge milestones, your verified skill
          evolution appears here.
        </p>
      </div>
    );
  }

  return (
    <div className="relative p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-strong)]">
            <Clock size={16} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--ink)]">
              Career Digital Twin &bull; Demonstrated Evolution
            </h4>
            <p className="text-xs text-[var(--ink-muted)]">
              Historical audit log of verified capabilities and career milestones
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-[var(--ink-muted)]">
          {timeline.length} Recorded Milestone{timeline.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border)]">
        {timeline.map((item, idx) => (
          <div key={item.id || idx} className="relative group text-left">
            {/* Timeline Dot */}
            <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 border-[var(--surface)] bg-[var(--accent)] shadow-sm group-hover:scale-125 transition-transform" />

            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-xs text-[var(--ink)]">
                  {item.title || item.event}
                </span>
                <span className="text-[11px] font-mono text-[var(--ink-muted)]">
                  {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : "Recent"}
                </span>
              </div>

              {item.description && (
                <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                  {item.description}
                </p>
              )}

              {item.skillsImpacted && item.skillsImpacted.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {item.skillsImpacted.map((s) => (
                    <span
                      key={s}
                      className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-[var(--surface)] border border-[var(--border)] text-emerald-400"
                    >
                      +{s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

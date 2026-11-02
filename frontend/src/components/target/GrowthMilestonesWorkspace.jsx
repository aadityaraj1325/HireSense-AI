import React from "react";
import { motion } from "framer-motion";
import {
  Award,
  Sparkles,
  Flame,
  CheckCircle2,
  Lock,
  Clock,
  Layers,
  GraduationCap,
  Scale,
} from "lucide-react";
import { useTargetAchievements } from "@/hooks/useTarget";

const BADGE_ICONS = {
  first_step: "🚀",
  streak_3: "🔥",
  streak_7: "⚡",
  streak_14: "👑",
  focus_10h: "⏱️",
  focus_50h: "🏆",
  revision_scholar: "🧠",
  reality_champion: "🎯",
};

export function GrowthMilestonesWorkspace() {
  const { data: achievements = [], isLoading } = useTargetAchievements();

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Award size={13} />
            <span>Growth Milestones & Proven Consistency</span>
          </div>
          <h2 className="font-display font-bold text-xl text-[var(--ink)]">
            Productivity Badges & Achievements
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
            Every task, routine adherence, and streak builds your permanent proof-of-consistency track record.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-center min-w-[120px]">
          <div className="text-[11px] text-[var(--ink-muted)]">Badges Unlocked</div>
          <div className="text-lg font-black font-display text-amber-500 mt-0.5">
            {unlockedCount} / {achievements.length}
          </div>
        </div>
      </div>

      {/* 2. Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-4 p-12 text-center text-xs text-[var(--ink-muted)]">
            Loading achievement milestones...
          </div>
        ) : (
          achievements.map((item) => {
            const isUnlocked = item.isUnlocked;
            const iconEmoji = BADGE_ICONS[item.code] || "⭐";
            const progress = item.progress || 0;
            const target = item.target || 1;
            const pct = Math.min(100, Math.round((progress / target) * 100));

            return (
              <motion.div
                key={item._id || item.code}
                layout
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-3 relative overflow-hidden ${
                  isUnlocked
                    ? "bg-gradient-to-br from-amber-500/10 via-[var(--surface)] to-purple-500/10 border-amber-500/30 shadow-card"
                    : "bg-[var(--surface)] border-[var(--border)] opacity-60"
                }`}
              >
                {/* Glow for unlocked */}
                {isUnlocked && (
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{iconEmoji}</span>
                    {isUnlocked ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={11} /> Unlocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--ink-muted)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full">
                        <Lock size={11} /> In Progress
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-[var(--ink)]">{item.title}</h3>
                    <p className="text-[11px] text-[var(--ink-muted)] mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                  <div className="flex justify-between text-[11px] text-[var(--ink-muted)] font-mono">
                    <span>Progress</span>
                    <span>{progress} / {target}</span>
                  </div>
                  <div className="w-full bg-[var(--surface-2)] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUnlocked ? "bg-amber-500" : "bg-purple-600"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}


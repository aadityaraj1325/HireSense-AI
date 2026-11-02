import React from "react";
import {
  Dna,
  Sparkles,
  Highlighter,
  HelpCircle,
  Layers,
  Clock,
  BookOpen,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export function LearningDNAView({ dnaData, isLoading, onSelectDoc }) {
  const metrics = dnaData?.metrics || {};
  const insights = dnaData?.insights || [];
  const phrases = dnaData?.highlightedPhrases || [];

  return (
    <div className="space-y-4 text-xs">
      <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between">
        <div>
          <div className="font-bold text-sm text-[var(--ink)] flex items-center gap-1.5">
            <Dna size={16} className="text-purple-400" />
            <span>Learning DNA — Behavioral Pattern Intelligence</span>
          </div>
          <p className="text-[11px] text-[var(--ink-muted)]">
            Algorithmic analysis of your active highlights, doubt triggers, flashcard recall, and study focus.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-10 text-center space-y-2">
          <Dna size={28} className="mx-auto text-purple-400 animate-spin" />
          <div className="text-xs font-bold text-[var(--ink)]">Analyzing cognitive study patterns across notes...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
              <div className="text-[10px] font-bold text-[var(--ink-muted)] uppercase flex items-center gap-1">
                <Highlighter size={12} className="text-amber-500" />
                <span>Highlights</span>
              </div>
              <div className="text-lg font-bold text-[var(--ink)]">{metrics.totalHighlights || 0}</div>
              <div className="text-[10px] text-[var(--ink-muted)]">Across all documents</div>
            </div>

            <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
              <div className="text-[10px] font-bold text-[var(--ink-muted)] uppercase flex items-center gap-1">
                <HelpCircle size={12} className="text-rose-400" />
                <span>Unresolved Doubts</span>
              </div>
              <div className="text-lg font-bold text-rose-400">{metrics.unresolvedDoubts || 0}</div>
              <div className="text-[10px] text-[var(--ink-muted)]">Requires review</div>
            </div>

            <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
              <div className="text-[10px] font-bold text-[var(--ink-muted)] uppercase flex items-center gap-1">
                <Layers size={12} className="text-emerald-400" />
                <span>Mastered Cards</span>
              </div>
              <div className="text-lg font-bold text-emerald-400">
                {metrics.masteredFlashcards || 0} / {metrics.totalFlashcards || 0}
              </div>
              <div className="text-[10px] text-[var(--ink-muted)]">Rating 4+ recall</div>
            </div>

            <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
              <div className="text-[10px] font-bold text-[var(--ink-muted)] uppercase flex items-center gap-1">
                <Clock size={12} className="text-blue-400" />
                <span>Study Minutes</span>
              </div>
              <div className="text-lg font-bold text-blue-400">{metrics.totalLearningMinutes || 0}m</div>
              <div className="text-[10px] text-[var(--ink-muted)]">In learning mode</div>
            </div>
          </div>

          {/* Actionable DNA Insights */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
              <Sparkles size={13} className="text-purple-400" />
              <span>Personalized Cognitive Insights & Revision Suggestions</span>
            </div>

            <div className="space-y-2">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{insight.icon}</span>
                    <h5 className="font-bold text-xs text-[var(--ink)]">{insight.title}</h5>
                  </div>
                  <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed pl-6">
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Frequently Highlighted Concepts */}
          {phrases.length > 0 && (
            <div className="p-4 rounded-3xl bg-[var(--surface-2)]/60 border border-[var(--border)] space-y-2.5">
              <div className="text-xs font-bold text-[var(--ink)]">
                Recent Critical Highlights & Focal Points
              </div>
              <div className="flex flex-wrap gap-1.5">
                {phrases.map((p, idx) => (
                  <div
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--ink)] flex items-center gap-1.5"
                  >
                    <span className="text-amber-500 font-bold">•</span>
                    <span className="font-medium italic truncate max-w-[200px]">"{p.text}"</span>
                    <span className="text-[9px] text-[var(--ink-muted)]">({p.docTitle})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


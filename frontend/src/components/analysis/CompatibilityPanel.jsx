import { AlertCircle, Check, CircleHelp, LockKeyhole, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const COMPONENTS = [
  ["keywordMatching", "Keyword Matching", 35],
  ["experienceRelevance", "Experience Relevance", 25],
  ["projectRelevance", "Project Relevance", 20],
  ["educationCertifications", "Education & Certifications", 10],
  ["structure", "Structure & Readability", 10],
];

const MATCH_TONE = {
  "Exact Match": "success",
  "Synonym Match": "success",
  "Semantic Match": "accent",
  "Partially Matched": "warning",
  Missing: "danger",
  "Not Applicable": "neutral",
};

export function CompatibilityPanel({ breakdown, matches = [], recommendations = [], rubricVersion }) {
  if (!breakdown && !matches.length) return null;
  const total = breakdown
    ? Object.values(breakdown).reduce((sum, value) => sum + Number(value || 0), 0)
    : null;

  return (
    <div className="space-y-5">
      {breakdown && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base">Job Compatibility Score</CardTitle>
              <CardDescription className="mt-1">
                Deterministic compatibility rubric {rubricVersion || "v1"} · proposed product weighting, not an employer ATS score.
              </CardDescription>
            </div>
            <Badge tone="accent">{total}/100</Badge>
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {COMPONENTS.map(([key, label, max]) => (
              <div key={key} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <p className="text-[11px] leading-4 text-[var(--ink-muted)]">{label}</p>
                <p className="mt-1 font-display text-lg font-semibold tabular text-[var(--ink)]">
                  {breakdown[key] ?? 0}<span className="ml-1 text-xs font-normal text-[var(--ink-muted)]">/{max}</span>
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base">Requirement Intelligence</CardTitle>
              <CardDescription className="mt-1">Every requirement is classified against resume evidence.</CardDescription>
            </div>
          </CardHeader>
          <div className="space-y-2">
            {matches.map((match) => (
              <div key={`${match.priority}-${match.requirement}`} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  {match.matchType === "Missing" ? <X size={14} className="text-[var(--danger)]" /> : <Check size={14} className="text-[var(--success)]" />}
                  <strong className="text-sm text-[var(--ink)]">{match.requirement}</strong>
                  <Badge tone={MATCH_TONE[match.matchType] || "neutral"}>{match.matchType}</Badge>
                  <span className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">{match.priority}</span>
                </div>
                {match.evidence && <p className="mt-2 border-l-2 border-[var(--accent)]/40 pl-3 text-xs leading-5 text-[var(--ink-muted)]">{match.section}: {match.evidence}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base">Evidence-Based Action Plan</CardTitle>
              <CardDescription className="mt-1">Confirm experience before adding any missing requirement.</CardDescription>
            </div>
            <LockKeyhole size={17} className="text-[var(--warning)]" />
          </CardHeader>
          <div className="space-y-3">
            {recommendations.map((item) => (
              <div key={`${item.priority}-${item.requirement}`} className="rounded-xl border border-[var(--border)] p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="text-[var(--warning)]" />
                  <strong className="text-sm text-[var(--ink)]">{item.requirement}</strong>
                  <Badge tone={item.priority === "critical" ? "danger" : "warning"}>{item.priority}</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--ink-muted)]">{item.whyItMatters}</p>
                <p className="mt-2 text-xs font-medium leading-5 text-[var(--accent-strong)]">{item.action}</p>
                {item.requiresConfirmation && <p className="mt-2 flex items-center gap-1 text-[10px] text-[var(--warning)]"><CircleHelp size={12} /> Candidate confirmation required</p>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

import { ArrowRight, CheckCircle2, CircleAlert, KeyRound, Target, Wand2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const LEGACY_COMPONENTS = [
  ["keywords", "Keyword alignment", 25, "Add only missing job terms that your experience genuinely supports."],
  ["formatting", "ATS formatting", 25, "Use standard headings, consistent dates, and parser-safe structure."],
  ["impact", "Content impact", 25, "Strengthen bullets with truthful actions, scope, and measurable outcomes."],
  ["clarity", "Clarity", 25, "Replace generic wording with concise evidence from your actual work."],
];

const COMPATIBILITY_COMPONENTS = [
  ["keywordMatching", "Keyword alignment", 35],
  ["experienceRelevance", "Experience relevance", 25],
  ["projectRelevance", "Project relevance", 20],
  ["educationCertifications", "Education & certifications", 10],
  ["structure", "Structure & readability", 10],
];

const toneFor = (severity) => (severity === "high" ? "danger" : severity === "medium" ? "warning" : "neutral");

export function AtsImprovementPlan({ analysis, onOpenIssues, onAnalyze }) {
  const score = Number(analysis?.atsScore || 0);
  const remaining = Math.max(0, 100 - score);
  const compatibility = Boolean(analysis?.compatibilityBreakdown);
  const breakdown = analysis?.compatibilityBreakdown || analysis?.scoreBreakdown || {};
  const components = compatibility ? COMPATIBILITY_COMPONENTS : LEGACY_COMPONENTS;
  const missing = analysis?.keywordsMissing || [];
  const issues = analysis?.issues || [];
  const rewrites = analysis?.bulletRewrites || [];
  const actions = [
    ...issues.slice(0, 3).map((issue) => ({
      id: `issue-${issue.title}`,
      icon: CircleAlert,
      title: issue.title,
      detail: issue.fix || issue.explanation,
      source: "Based on your latest analysis",
      tone: toneFor(issue.severity),
    })),
    ...(missing.length
      ? [{
          id: "keywords",
          icon: KeyRound,
          title: `Review ${missing.length} missing keyword${missing.length === 1 ? "" : "s"}`,
          detail: missing.slice(0, 6).join(", "),
          source: "Add only if your experience supports them",
          tone: "warning",
        }]
      : []),
    ...(rewrites.length
      ? [{
          id: "rewrites",
          icon: Wand2,
          title: `${rewrites.length} bullet improvement${rewrites.length === 1 ? "" : "s"} available`,
          detail: rewrites[0].rationale || "Review the proposed rewrite before applying it.",
          source: `Example: “${rewrites[0].original}” → “${rewrites[0].rewritten}”`,
          tone: "accent",
        }]
      : []),
  ].slice(0, 5);

  return (
    <Card padding="lg" radius="lg" className="border-[var(--accent)]/25">
      <CardHeader>
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
            <Target size={13} /> Improvement plan
          </div>
          <CardTitle className="text-lg">What to improve to reach your ATS score of 100</CardTitle>
          <CardDescription className="mt-1">
            {remaining ? `Your current score is ${score}. You need ${remaining} more points, but the exact lift can only be confirmed after re-analysis.` : "You have reached the 100-point target. Re-analyze after every real change to verify it."}
          </CardDescription>
        </div>
        <Badge tone={remaining ? "warning" : "success"}>{score}/100</Badge>
      </CardHeader>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {components.map(([key, label, max, hint]) => {
          const value = Number(breakdown[key] || 0);
          const headroom = Math.max(0, max - value);
          return (
            <div key={key} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[var(--ink-muted)]">{label}</span>
                <span className="font-display text-sm font-semibold tabular text-[var(--ink)]">{value}/{max}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface)]">
                <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
              </div>
              <p className="mt-2 text-[10px] leading-4 text-[var(--ink-muted)]">{headroom ? `Up to ${headroom} points of rubric headroom` : hint}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-2">
        {actions.length ? actions.map(({ id, icon: Icon, title, detail, source, tone }) => (
          <div key={id} className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-strong)]"><Icon size={15} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-[var(--ink)]">{title}</strong><Badge tone={tone}>action</Badge></div>
              <p className="mt-1 text-xs leading-5 text-[var(--ink-muted)]">{detail}</p>
              <p className="mt-1 text-[11px] text-[var(--accent-strong)]">{source}</p>
            </div>
            <ArrowRight size={15} className="mt-1 shrink-0 text-[var(--ink-muted)]" />
          </div>
        )) : (
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--ink-muted)]"><CheckCircle2 size={16} className="text-[var(--success)]" /> No additional suggestions were returned for this analysis.</div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onOpenIssues}>View detailed issues</Button>
        <Button variant="accent" size="sm" onClick={onAnalyze}><Target size={14} /> Re-analyze after changes</Button>
      </div>
    </Card>
  );
}

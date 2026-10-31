import { useMemo, useState } from "react";
import { ArrowLeft, Check, CircleAlert, FileSearch, LockKeyhole, Search, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useKeywordIntelligence, useResume } from "@/hooks/useResumes";

const TONES = {
  "Exact Match": "success",
  "Synonym Match": "success",
  "Semantic Match": "accent",
  "Partially Matched": "warning",
  Missing: "danger",
};

function MatchRow({ match, selected, onSelect }) {
  const isMissing = match.matchType === "Missing";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        selected ? "border-[var(--accent)] bg-[var(--accent-soft)]/40" : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--accent)]/60"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 ${isMissing ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
          {isMissing ? <X size={16} /> : <Check size={16} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <strong className="text-sm text-[var(--ink)]">{match.requirement}</strong>
            <Badge tone={TONES[match.matchType] || "neutral"}>{match.matchType}</Badge>
            <span className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">{match.priority}</span>
          </span>
          <span className="mt-2 flex flex-wrap gap-2 text-[11px] text-[var(--ink-muted)]">
            <span>{match.category || "requirement"}</span>
            {match.section && <span>· found in {match.section}</span>}
            {match.confidence != null && <span>· {Math.round(match.confidence * 100)}% confidence</span>}
          </span>
        </span>
      </div>
    </button>
  );
}

export default function KeywordIntelligence() {
  const { id } = useParams();
  const nav = useNavigate();
  const resumeQuery = useResume(id);
  const versions = resumeQuery.data?.versions || [];
  const versionId = resumeQuery.data?.resume?.currentVersionId || versions[versions.length - 1]?._id;
  const intelligenceQuery = useKeywordIntelligence(id, versionId);
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const matches = useMemo(() => intelligenceQuery.data?.matches || [], [intelligenceQuery.data?.matches]);
  const selected = matches.find((item) => `${item.priority}-${item.requirement}` === selectedId) || matches[0];
  const filtered = useMemo(
    () => matches.filter((item) => filter === "all" || (filter === "missing" ? item.matchType === "Missing" : item.matchType !== "Missing")),
    [matches, filter]
  );

  if (resumeQuery.isLoading || intelligenceQuery.isLoading) {
    return <div className="space-y-4"><Skeleton className="h-12 w-1/3 rounded-2xl" /><Skeleton className="h-[520px] rounded-3xl" /></div>;
  }
  if (resumeQuery.error || intelligenceQuery.error) {
    return <EmptyState icon={FileSearch} title="Keyword intelligence unavailable" description={(resumeQuery.error || intelligenceQuery.error)?.message} />;
  }
  if (!intelligenceQuery.data?.analysis || !matches.length) {
    return (
      <div className="space-y-5">
        <PageHeader title="Keyword Intelligence" description="Map job requirements to evidence in your resume." />
        <EmptyState icon={FileSearch} title="Run a job-specific analysis first" description="Paste a complete job description on the resume analysis page so HireSense can classify requirements and map them to evidence." action={<Button variant="accent" onClick={() => nav(`/resumes/${id}`)}>Open resume analysis</Button>} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Keyword Intelligence"
        description={`Evidence map for ${versions.find((version) => version._id === versionId)?.label || "the current resume version"}.`}
        actions={<Button variant="ghost" onClick={() => nav(`/resumes/${id}`)}><ArrowLeft size={14} /> Resume analysis</Button>}
      />
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-base">Job requirement → resume evidence</CardTitle>
            <CardDescription className="mt-1">Deterministic classifications from the saved analysis. No missing skill is treated as proven experience.</CardDescription>
          </div>
          <Badge tone="accent">{intelligenceQuery.data.analysis.atsScore}/100</Badge>
        </CardHeader>
        <div className="flex flex-wrap gap-2">
          {[["all", "All requirements"], ["matched", "Matched"], ["missing", "Missing"]].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full border px-3 py-1.5 text-xs ${filter === value ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "border-[var(--border)] text-[var(--ink-muted)]"}`}>{label}</button>
          ))}
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,.9fr)]">
          <div className="space-y-2">
            {filtered.map((match) => {
              const key = `${match.priority}-${match.requirement}`;
              return <MatchRow key={key} match={match} selected={selectedId === key} onSelect={() => setSelectedId(key)} />;
            })}
          </div>
          {selected && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
              <div className="flex items-center gap-2"><Search size={16} className="text-[var(--accent-strong)]" /><h3 className="text-sm font-semibold text-[var(--ink)]">{selected.requirement}</h3></div>
              <div className="mt-3 flex flex-wrap gap-2"><Badge tone={TONES[selected.matchType] || "neutral"}>{selected.matchType}</Badge><Badge tone="neutral">{selected.priority}</Badge></div>
              <Detail label="Why it matters" value={selected.priority === "mandatory" ? "This requirement was extracted as mandatory from the target job description." : "This preferred requirement can improve relevance for the target role."} />
              <Detail label="Job description evidence" value={selected.jobEvidence || "The stored extraction did not retain a matching sentence."} />
              <Detail label="Resume evidence" value={selected.evidence || "No supporting resume evidence was found."} />
              <Detail label="Recommended action" value={selected.matchType === "Missing" ? `Verify your experience with ${selected.requirement} before adding it. If supported, place it in the most relevant section and describe how you used it.` : `Strengthen the ${selected.section || "relevant"} evidence with a specific, truthful example.`} />
              {selected.matchType === "Missing" && <p className="mt-4 flex items-center gap-2 text-[11px] text-[var(--warning)]"><LockKeyhole size={13} /> Candidate confirmation required before adding this skill.</p>}
            </div>
          )}
        </div>
      </Card>
      <Card>
        <CardHeader><div><CardTitle className="text-base">Action queue</CardTitle><CardDescription className="mt-1">Prioritized recommendations generated from missing or partial evidence.</CardDescription></div><CircleAlert size={17} className="text-[var(--warning)]" /></CardHeader>
        <div className="space-y-2">
          {(intelligenceQuery.data.recommendations || []).map((item) => <div key={`${item.priority}-${item.requirement}`} className="rounded-xl border border-[var(--border)] p-3"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-[var(--ink)]">{item.requirement}</strong><Badge tone={item.priority === "critical" ? "danger" : "warning"}>{item.priority}</Badge></div><p className="mt-1 text-xs leading-5 text-[var(--ink-muted)]">{item.action}</p></div>)}
        </div>
      </Card>
    </div>
  );
}

function Detail({ label, value }) {
  return <div className="mt-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">{label}</p><p className="mt-1 text-xs leading-5 text-[var(--ink)]">{value}</p></div>;
}

import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  CircleAlert,
  FileText,
  KeyRound,
  Lightbulb,
  MessageCircle,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import { ResumeGrowthExplorer } from "@/components/dashboard/ResumeGrowthExplorer";

const SEVERITY = { low: "neutral", medium: "warning", high: "danger" };

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { data, isLoading, error } = useDashboard();
  if (isLoading) return <DashboardSkeleton />;
  if (error) return <EmptyState icon={Target} title="Couldn't load your dashboard" description={error.message} />;

  const { totals = {}, latestResume, kpi = {}, latestAnalysis, careerReadiness } = data || {};
  const current = kpi.atsScore?.value;
  const recommendations = [
    ...(latestAnalysis?.issues || []).map((issue) => ({
      icon: CircleAlert,
      title: issue.title,
      description: issue.explanation || "This section can be clearer and more targeted.",
      action: issue.fix || "Review this recommendation in your resume.",
      tone: SEVERITY[issue.severity] || "neutral",
    })),
    ...(latestAnalysis?.keywordsMissing || []).slice(0, 2).map((keyword) => ({
      icon: KeyRound,
      title: `Add “${keyword}”`,
      description: "This relevant keyword was not detected in your latest analysis.",
      action: "Add it where it truthfully reflects your experience.",
      tone: "warning",
    })),
  ].slice(0, 4);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-6 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-card">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
            <Sparkles size={14} /> Career intelligence
          </div>
          <h1 className="max-w-3xl font-display text-4xl sm:text-5xl font-semibold tracking-[-0.045em] leading-[1.05] text-[var(--ink)]">
            Let&apos;s improve your career together, {user?.name?.split(" ")[0] || "there"}.
          </h1>
          <p className="mt-3 max-w-2xl text-base sm:text-lg leading-7 text-[var(--ink-muted)]">Your latest career insights, resume recommendations, and professional growth in one place.</p>
        </div>
        <Button variant="accent" onClick={() => nav(latestResume?.id ? `/resumes/${latestResume.id}` : "/resumes")}>
          <FileText size={16} /> {latestResume ? "Open latest resume" : "Upload a resume"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <ResumeGrowthExplorer series={data?.scoreSeries || []} activity={data?.activity || []} latestResumeId={latestResume?.id} />
        </div>

        <Card className="xl:col-span-5" padding="lg" radius="lg">
          <CardHeader><div><CardTitle>Career Readiness</CardTitle><CardDescription className="mt-1">A combined view of your latest resume signals.</CardDescription></div><Badge tone={careerReadiness != null && careerReadiness >= 70 ? "success" : "warning"}>{careerReadiness != null ? "Live signal" : "Awaiting analysis"}</Badge></CardHeader>
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <div className="relative grid h-44 w-44 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#39c5b3 ${(careerReadiness || 0) * 3.6}deg, var(--surface-2) 0deg)` }}>
              <div className="grid h-32 w-32 place-items-center rounded-full bg-[var(--surface)]"><div className="text-center"><div className="font-display text-4xl font-semibold tabular">{careerReadiness ?? "—"}</div><div className="text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">readiness</div></div></div>
            </div>
            <div className="w-full space-y-3">
              <Signal label="ATS score" value={current} color="var(--accent)" />
              <Signal label="Keyword coverage" value={kpi.keywordsMatched?.total ? Math.round((kpi.keywordsMatched.value / kpi.keywordsMatched.total) * 100) : null} color="var(--success)" />
              <p className="pt-1 text-[11px] leading-5 text-[var(--ink-muted)]">Readiness is derived from your ATS score and detected keyword coverage. It is not a replacement for the ATS score.</p>
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-7" padding="lg" radius="lg">
          <CardHeader><div><CardTitle>AI Resume Intelligence</CardTitle><CardDescription className="mt-1">Important recommendations based on your latest resume analysis.</CardDescription></div><Sparkles size={18} className="text-[var(--accent-strong)]" /></CardHeader>
          {recommendations.length ? <div className="grid gap-3 sm:grid-cols-2">{recommendations.map((item, index) => <Recommendation key={`${item.title}-${index}`} {...item} />)}</div> : <EmptyCard icon={Lightbulb} title="No recommendations yet" description="Your next Gemini-powered analysis will surface focused improvements here." />}
          <Button variant="soft" className="mt-5" onClick={() => nav("/interview")}><MessageCircle size={15} /> Explore with HireSense AI <ArrowUpRight size={14} /></Button>
        </Card>

        <Card className="xl:col-span-5" padding="lg" radius="lg">
          <CardHeader><div><CardTitle>Latest Resume Metrics</CardTitle><CardDescription className="mt-1">{latestAnalysis?.createdAt ? `Analyzed ${new Date(latestAnalysis.createdAt).toLocaleDateString()}` : "No analysis recorded yet."}</CardDescription></div><Target size={18} className="text-[var(--success)]" /></CardHeader>
          <div className="space-y-2">{[
            ["ATS score", current, "/ 100", TrendingUp],
            ["Keywords matched", kpi.keywordsMatched?.value, kpi.keywordsMatched?.total ? `/ ${kpi.keywordsMatched.total}` : "", KeyRound],
            ["Keywords missing", latestAnalysis?.keywordsMissing?.length, "", KeyRound],
            ["Issues identified", kpi.issuesIdentified?.value, "", CircleAlert],
            ["Resume versions", kpi.versions?.value || totals.versions, "", FileText],
          ].map(([label, value, suffix, Icon]) => value != null && <div key={label} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3"><span className="flex items-center gap-2 text-xs text-[var(--ink-muted)]"><Icon size={14} /> {label}</span><strong className="font-display tabular text-sm text-[var(--ink)]">{value} <span className="text-xs font-normal text-[var(--ink-muted)]">{suffix}</span></strong></div>)}</div>
        </Card>
      </div>
    </div>
  );
}

function Signal({ label, value, color }) {
  return <div><div className="mb-1.5 flex justify-between text-xs"><span className="text-[var(--ink-muted)]">{label}</span><strong className="tabular text-[var(--ink)]">{value != null ? `${value}%` : "—"}</strong></div><div className="h-1.5 rounded-full bg-[var(--surface-2)]"><div className="h-full rounded-full" style={{ width: `${Math.min(100, value || 0)}%`, background: color }} /></div></div>;
}

function Recommendation({ icon: Icon, title, description, action, tone }) {
  return <motion.div whileHover={{ y: -2 }} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5"><div className="flex items-start gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-strong)]"><Icon size={15} /></div><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate text-sm font-semibold text-[var(--ink)]">{title}</h3><Badge tone={tone}>{tone}</Badge></div><p className="mt-1 text-xs leading-5 text-[var(--ink-muted)]">{description}</p><p className="mt-2 text-[11px] font-medium text-[var(--accent-strong)]">{action}</p></div></div></motion.div>;
}

function EmptyCard({ icon: Icon, title, description }) {
  return <div className="grid min-h-[150px] place-items-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)]/50 p-5 text-center"><Icon size={20} className="text-[var(--ink-muted)]" /><p className="mt-2 text-sm font-medium">{title}</p><p className="mt-1 text-xs text-[var(--ink-muted)]">{description}</p></div>;
}

function DashboardSkeleton() {
  return <div className="space-y-5"><Skeleton className="h-24 rounded-2xl" /><div className="grid gap-5 xl:grid-cols-12"><Skeleton className="h-[390px] rounded-3xl xl:col-span-7" /><Skeleton className="h-[390px] rounded-3xl xl:col-span-5" /><Skeleton className="h-[330px] rounded-3xl xl:col-span-7" /><Skeleton className="h-[330px] rounded-3xl xl:col-span-5" /></div></div>;
}

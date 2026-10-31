import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  GitCompare,
  Layers3,
  Radar as RadarIcon,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  AreaChart,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const METRICS = [
  { key: "atsScore", label: "ATS Score", color: "#9675F5", fill: "atsFill" },
  { key: "keywordCoverage", label: "Keyword Coverage", color: "#28C5B6", fill: "keywordFill" },
  { key: "resumeQuality", label: "Resume Quality", color: "#69D6A5", fill: "qualityFill" },
  { key: "contentImpact", label: "Content Impact", color: "#E65D91", fill: "impactFill" },
];

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Date unavailable";

const formatMetric = (value, suffix = "%") =>
  value == null ? "Not available" : `${value}${suffix}`;

function metricSuffix(key) {
  return key === "atsScore" || key === "resumeQuality" ? "/100" : "%";
}

function ExplorerTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="w-56 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-hover">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-sm text-[var(--ink)]">Resume Version: {point.label}</strong>
        <span className="text-[10px] text-[var(--ink-muted)]">{formatDate(point.at)}</span>
      </div>
      <div className="mt-3 space-y-1.5">
        {METRICS.filter((metric) => point[metric.key] != null).map((metric) => (
          <div key={metric.key} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-[var(--ink-muted)]">
              <i className="h-1.5 w-1.5 rounded-full" style={{ background: metric.color }} />
              {metric.label}
            </span>
            <strong className="tabular text-[var(--ink)]">{formatMetric(point[metric.key], metricSuffix(metric.key))}</strong>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-[var(--border)] pt-2 text-xs">
        <span className="text-[var(--ink-muted)]">Change from previous</span>{" "}
        <strong className={point.scoreChange >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}>
          {point.scoreChange == null ? "—" : `${point.scoreChange > 0 ? "+" : ""}${point.scoreChange} points`}
        </strong>
      </div>
    </div>
  );
}

function VersionDot({ cx, cy, payload, onSelect }) {
  if (cx == null || cy == null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="var(--surface)"
      stroke="#9675F5"
      strokeWidth={2}
      tabIndex={0}
      role="button"
      aria-label={`Open ${payload.label} details`}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(payload);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect(payload);
      }}
    />
  );
}

export function ResumeGrowthExplorer({ series = [], activity = [], latestResumeId }) {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState("all");
  const [now] = useState(() => Date.now());
  const [versionFilter, setVersionFilter] = useState("all");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [visible, setVisible] = useState(
    Object.fromEntries(METRICS.map(({ key }) => [key, true]))
  );
  const [hoveredLabel, setHoveredLabel] = useState(null);
  const [selectedId, setSelectedId] = useState(series.at(-1)?.pointId || series.at(-1)?.versionId || null);
  const [compareIds, setCompareIds] = useState({
    first: series.at(-2)?.pointId || series.at(-2)?.versionId || series.at(-1)?.pointId || "",
    second: series.at(-1)?.pointId || series.at(-1)?.versionId || "",
  });

  const filteredSeries = useMemo(() => {
    let result = series;
    if (timeFilter === "30" || timeFilter === "90") {
      const cutoff = now - Number(timeFilter) * 24 * 60 * 60 * 1000;
      result = result.filter((point) => new Date(point.at).getTime() >= cutoff);
    }
    if (timeFilter === "custom") {
      const from = customRange.from ? new Date(`${customRange.from}T00:00:00`).getTime() : -Infinity;
      const to = customRange.to ? new Date(`${customRange.to}T23:59:59`).getTime() : Infinity;
      result = result.filter((point) => new Date(point.at).getTime() >= from && new Date(point.at).getTime() <= to);
    }
    if (versionFilter === "latest") return result.slice(-1);
    if (versionFilter === "compare") {
      return result.filter((point) => [compareIds.first, compareIds.second].includes(point.pointId || point.versionId));
    }
    return result;
  }, [compareIds, customRange, now, series, timeFilter, versionFilter]);

  const selected = series.find((point) => (point.pointId || point.versionId) === selectedId) || series.at(-1);
  const availableMetrics = METRICS.filter(
    (metric) => metric.key !== "contentImpact" || series.some((point) => point[metric.key] != null)
  );
  const compareFirst = series.find((point) => (point.pointId || point.versionId) === compareIds.first) || series.at(-2);
  const compareSecond = series.find((point) => (point.pointId || point.versionId) === compareIds.second) || series.at(-1);
  const radarData = selected && compareSecond
    ? [
        ["Keyword Optimization", "keywordOptimization"],
        ["Formatting", "formatting"],
        ["Content Impact", "contentImpact"],
        ["Clarity", "clarity"],
        ["Job Relevance", "jobRelevance"],
      ].map(([subject, key]) => ({
        subject,
        current: selected.radar?.[key],
        comparison: compareSecond.radar?.[key],
      }))
    : [];
  const waterfallData = selected
    ? [
        { label: "Previous score", value: selected.previousScore },
        { label: "ATS score change", value: selected.scoreChange },
        { label: "Current score", value: selected.atsScore },
        { label: "Keyword movement", value: delta(selected, compareFirst, "keywordCoverage") },
        { label: "Quality movement", value: delta(selected, compareFirst, "resumeQuality") },
        { label: "Impact movement", value: delta(selected, compareFirst, "contentImpact") },
      ].filter((item) => item.value != null)
    : [];

  function selectVersion(point) {
    setSelectedId(point.pointId || point.versionId);
    setCompareIds((current) => ({ ...current, second: point.pointId || point.versionId }));
  }

  function toggleMetric(key) {
    setVisible((current) => ({ ...current, [key]: !current[key] }));
  }

  if (!series.length) {
    return (
      <Card padding="lg" radius="lg">
        <EmptyExplorer title="Your Resume Growth Explorer is ready" description="Analyze a resume to start tracking ATS score, keyword coverage, and quality across versions." onClick={() => latestResumeId && navigate(`/resumes/${latestResumeId}`)} />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card padding="lg" radius="lg">
        <CardHeader className="mb-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              <Sparkles size={13} /> HireSense AI
            </div>
            <CardTitle className="text-lg">Resume Growth Explorer</CardTitle>
            <CardDescription className="mt-1">Understand what changed across your analyzed resume versions.</CardDescription>
          </div>
          <Badge tone={series.length > 1 ? "success" : "neutral"}>{series.length} analyzed version{series.length === 1 ? "" : "s"}</Badge>
        </CardHeader>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          {["all", "30", "90", "custom"].map((value) => (
            <button key={value} type="button" onClick={() => setTimeFilter(value)} className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${timeFilter === value ? "border-[var(--accent)]/50 bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)]"}`}>
              {value === "all" ? "All Time" : value === "custom" ? "Custom Range" : `Last ${value} Days`}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-[var(--border)]" />
          <select aria-label="Version filter" value={versionFilter} onChange={(event) => setVersionFilter(event.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--ink)] outline-none">
            <option value="all">All Versions</option>
            <option value="latest">Latest Version</option>
            <option value="compare">Compare Versions</option>
          </select>
          {timeFilter === "custom" && (
            <>
              <input aria-label="Start date" type="date" value={customRange.from} onChange={(event) => setCustomRange((range) => ({ ...range, from: event.target.value }))} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-xs text-[var(--ink)]" />
              <input aria-label="End date" type="date" value={customRange.to} onChange={(event) => setCustomRange((range) => ({ ...range, to: event.target.value }))} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-xs text-[var(--ink)]" />
            </>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {METRICS.map((metric) => (
            <button key={metric.key} type="button" aria-pressed={visible[metric.key]} onClick={() => toggleMetric(metric.key)} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] transition-colors ${visible[metric.key] ? "border-[var(--border)] text-[var(--ink)]" : "border-transparent text-[var(--ink-muted)] opacity-60"}`}>
              <i className="h-2 w-2 rounded-full" style={{ background: metric.color }} /> {metric.label}
              {visible[metric.key] && <Check size={12} />}
            </button>
          ))}
        </div>

        {series.length === 1 && <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--ink-muted)]"><RefreshCw size={14} className="text-[var(--accent-strong)]" /> Analyze or create another version to reveal meaningful growth over time.</div>}

        {filteredSeries.length ? (
          <div className="h-[310px]" role="img" aria-label="Interactive resume growth chart showing ATS score and available quality metrics over time.">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredSeries}
                margin={{ top: 12, right: 14, left: 2, bottom: 4 }}
                onMouseMove={(state) => setHoveredLabel(state?.activeLabel || null)}
                onMouseLeave={() => setHoveredLabel(null)}
              >
                <defs>
                  {METRICS.map((metric) => <linearGradient key={metric.fill} id={metric.fill} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={metric.color} stopOpacity=".22" /><stop offset="100%" stopColor={metric.color} stopOpacity="0" /></linearGradient>)}
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 4" />
                <XAxis dataKey="label" interval={0} minTickGap={18} tick={{ fontSize: 11, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} allowDecimals={false} tickFormatter={(value) => `${value}`} tick={{ fontSize: 11, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} width={32} />
                <Tooltip content={<ExplorerTooltip />} cursor={false} />
                {hoveredLabel && <ReferenceLine x={hoveredLabel} stroke="#7d88a5" strokeOpacity=".7" strokeDasharray="4 4" />}
                <Legend verticalAlign="top" align="right" height={28} iconType="circle" wrapperStyle={{ fontSize: 11, color: "var(--ink-muted)" }} />
                {availableMetrics.map((metric) => visible[metric.key] && <Area key={metric.key} type="monotone" dataKey={metric.key} name={metric.label} stroke={metric.color} strokeWidth={2.2} fill={`url(#${metric.fill})`} fillOpacity={1} connectNulls={false} dot={metric.key === "atsScore" ? (props) => <VersionDot {...props} onSelect={selectVersion} /> : { r: 3, fill: metric.color, stroke: "var(--surface)", strokeWidth: 1.5 }} activeDot={{ r: 6 }} isAnimationActive animationDuration={700} />)}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyExplorer title="Select at least one metric" description="Use the metric controls above to bring a signal back into the chart." />}

        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
          {series.map((point) => <button key={point.pointId || point.versionId} type="button" onClick={() => selectVersion(point)} className={`group flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${selected?.pointId === point.pointId ? "border-[var(--accent)]/50 bg-[var(--accent-soft)] text-[var(--ink)]" : "border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)]"}`}><span className="h-2 w-2 rounded-full bg-[var(--accent)]" /> {point.label}<ChevronRight size={12} className="opacity-50 transition-transform group-hover:translate-x-0.5" /></button>)}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <ImpactCard data={waterfallData} selected={selected} />
        <RadarComparison data={radarData} first={compareFirst} second={compareSecond} options={series} onChange={(key, value) => setCompareIds((current) => ({ ...current, [key]: value }))} />
      </div>

      <VersionDetails point={selected} latestResumeId={latestResumeId} onCompare={() => { setVersionFilter("compare"); setCompareIds((current) => ({ ...current, second: selected?.pointId || selected?.versionId || current.second })); }} navigate={navigate} />
      <Timeline series={series} activity={activity} />
    </div>
  );
}

function delta(current, previous, key) {
  if (current?.[key] == null || previous?.[key] == null) return null;
  return current[key] - previous[key];
}

function ImpactCard({ data, selected }) {
  return (
    <Card padding="lg" radius="lg">
      <CardHeader><div><CardTitle className="text-base">ATS Score Impact</CardTitle><CardDescription className="mt-1">Before-and-after context from stored analysis signals.</CardDescription></div><BarChart3 size={18} className="text-[var(--accent-strong)]" /></CardHeader>
      {data.length ? <><div className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{ left: 18, right: 8, top: 8, bottom: 0 }}><CartesianGrid stroke="var(--border)" horizontal={false} strokeDasharray="3 4" /><XAxis type="number" domain={[-100, 100]} tick={{ fontSize: 10, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="label" width={105} tick={{ fontSize: 10, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} /><ReferenceLine x={0} stroke="var(--border)" /><Tooltip formatter={(value) => [`${value > 0 ? "+" : ""}${value}`, "Movement"]} contentStyle={{ background: "var(--surface)", borderColor: "var(--border)", borderRadius: 12, fontSize: 11 }} /><Bar dataKey="value" radius={[0, 5, 5, 0]}>{data.map((item) => <Cell key={item.label} fill={item.label.includes("score") ? "#8975e8" : item.value >= 0 ? "#39c5b3" : "#f1848a"} />)}</Bar></BarChart></ResponsiveContainer></div><p className="text-[11px] leading-5 text-[var(--ink-muted)]">Component movement is shown as context only; it is not an additive attribution of the ATS score.</p></> : <EmptyExplorer title="No score change to explain yet" description={selected ? "Analyze another version to compare before and after signals." : "Select an analyzed version to inspect its score context."} />}
    </Card>
  );
}

function RadarComparison({ data, first, second, options, onChange }) {
  return (
    <Card padding="lg" radius="lg">
      <CardHeader><div><CardTitle className="text-base">Resume DNA</CardTitle><CardDescription className="mt-1">Compare stored score-breakdown dimensions between versions.</CardDescription></div><RadarIcon size={18} className="text-[var(--success)]" /></CardHeader>
      <div className="mb-3 grid grid-cols-2 gap-2"><select aria-label="First version" value={first?.versionId || ""} onChange={(event) => onChange("first", event.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-xs text-[var(--ink)]"><option value="">Previous</option>{options.map((option) => <option key={option.versionId} value={option.versionId}>{option.label}</option>)}</select><select aria-label="Second version" value={second?.versionId || ""} onChange={(event) => onChange("second", event.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-xs text-[var(--ink)]"><option value="">Latest</option>{options.map((option) => <option key={option.versionId} value={option.versionId}>{option.label}</option>)}</select></div>
      {data.some((item) => item.current != null || item.comparison != null) ? <div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><RadarChart data={data}><PolarGrid stroke="var(--border)" /><PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "var(--ink-muted)" }} /><PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} /><Radar name={first?.label || "Previous"} dataKey="comparison" stroke="#66a8ff" fill="#66a8ff" fillOpacity=".12" /><Radar name={second?.label || "Current"} dataKey="current" stroke="#8975e8" fill="#8975e8" fillOpacity=".18" /><Tooltip contentStyle={{ background: "var(--surface)", borderColor: "var(--border)", borderRadius: 12, fontSize: 11 }} /></RadarChart></ResponsiveContainer></div> : <EmptyExplorer title="DNA appears after analysis" description="Score breakdown dimensions are available when Gemini returns them." />}
    </Card>
  );
}

function VersionDetails({ point, latestResumeId, onCompare, navigate }) {
  if (!point) return null;
  return (
    <Card padding="lg" radius="lg">
      <CardHeader><div><CardTitle className="text-base">{point.label} details</CardTitle><CardDescription className="mt-1">{formatDate(point.at)} · {point.sourceType === "rewrite" ? "AI rewrite version" : "Uploaded version"}</CardDescription></div><Badge tone={point.scoreChange >= 0 ? "success" : "danger"}>{point.scoreChange == null ? "Baseline" : `${point.scoreChange > 0 ? "+" : ""}${point.scoreChange} pts`}</Badge></CardHeader>
      <div className="grid gap-3 sm:grid-cols-3">{[["ATS score", formatMetric(point.atsScore, "/100")], ["Keyword coverage", formatMetric(point.keywordCoverage)], ["Missing keywords", point.keywordsMissing?.length ?? "Not available"]].map(([label, value]) => <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"><p className="text-xs text-[var(--ink-muted)]">{label}</p><p className="mt-1 font-display text-lg font-semibold tabular text-[var(--ink)]">{value}</p></div>)}</div>
      {point.improvements?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{point.improvements.map((item) => <span key={item} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] text-[var(--accent-strong)]"><Check size={12} /> {item}</span>)}</div>}
      <div className="mt-5 flex flex-wrap gap-2"><Button variant="accent" size="sm" onClick={() => latestResumeId && navigate(`/resumes/${latestResumeId}`)}><ArrowUpRight size={14} /> Open Resume</Button><Button variant="outline" size="sm" onClick={onCompare}><GitCompare size={14} /> Compare Version</Button></div>
    </Card>
  );
}

function Timeline({ series, activity }) {
  const events = activity.length
    ? activity.slice(0, 8)
    : series.map((point) => ({
        id: point.versionId,
        type: point.sourceType === "rewrite" ? "rewrite" : "analyze",
        title: point.sourceType === "rewrite" ? "AI rewrite created" : "Resume analyzed",
        subtitle: `${point.label} scored ${formatMetric(point.atsScore, "/100")}`,
        at: point.at,
      }));
  return (
    <Card padding="lg" radius="lg">
      <CardHeader><div><CardTitle className="text-base">Resume Improvement Timeline</CardTitle><CardDescription className="mt-1">The milestones behind your growth curve.</CardDescription></div><CalendarDays size={18} className="text-[var(--accent-strong)]" /></CardHeader>
      <div className="grid gap-3 md:grid-cols-2">{events.map((event) => <div key={event.id} className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"><div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--accent)] ring-4 ring-[var(--accent-soft)]" /><div><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-[var(--ink)]">{event.title}</strong><span className="text-[11px] text-[var(--ink-muted)]">{formatDate(event.at)}</span></div><p className="mt-1 text-xs text-[var(--ink-muted)]">{event.subtitle}</p></div></div>)}</div>
    </Card>
  );
}

function EmptyExplorer({ title, description, onClick }) {
  return <div className="grid min-h-[170px] place-items-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)]/50 p-6 text-center"><Layers3 size={22} className="text-[var(--ink-muted)]" /><p className="mt-2 text-sm font-medium text-[var(--ink)]">{title}</p><p className="mt-1 max-w-sm text-xs leading-5 text-[var(--ink-muted)]">{description}</p>{onClick && <Button variant="soft" size="sm" className="mt-4" onClick={onClick}>Analyze resume</Button>}</div>;
}

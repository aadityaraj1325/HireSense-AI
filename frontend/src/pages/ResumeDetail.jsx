import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Sparkles, ArrowLeft, Loader2, FileText, Download, ClipboardPaste, Search, ChevronDown, ChevronUp, Route, Layers } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { AtsGauge } from "@/components/dashboard/AtsGauge";
import { ScoreBreakdown } from "@/components/analysis/ScoreBreakdown";
import { IssuesList } from "@/components/analysis/IssuesList";
import { StrengthsList } from "@/components/analysis/StrengthsList";
import { KeywordChips } from "@/components/analysis/KeywordChips";
import { BulletRewrites } from "@/components/analysis/BulletRewrites";
import { CompatibilityPanel } from "@/components/analysis/CompatibilityPanel";
import { AtsImprovementPlan } from "@/components/analysis/AtsImprovementPlan";
import { VersionSwitcher } from "@/components/resume/VersionSwitcher";
import { CVVersionsPanel } from "@/components/resume/CVVersionsPanel";
import { DiffView } from "@/components/resume/DiffView";
import { relativeTime } from "@/lib/utils";
import {
  useResume,
  useAnalysisForVersion,
  useAnalyzeResume,
  useApplyRewrites,
  useSuggestRoles,
} from "@/hooks/useResumes";

export default function ResumeDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation();

  const { data, isLoading, error } = useResume(id);
  const resume = data?.resume;
  const versions = data?.versions || [];

  const [activeVersionId, setActiveVersionId] = useState(null);
  useEffect(() => {
    if (!activeVersionId && versions.length) {
      setActiveVersionId(resume?.currentVersionId || versions[versions.length - 1]._id);
    }
  }, [versions, resume, activeVersionId]);

  const activeVersion = useMemo(
    () => versions.find((v) => v._id === activeVersionId),
    [versions, activeVersionId]
  );

  const analysisQuery = useAnalysisForVersion(id, activeVersionId);
  const analysis = analysisQuery.data;

  const analyze = useAnalyzeResume(id);
  const applyRewrites = useApplyRewrites(id);
  const suggestRoles = useSuggestRoles();
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState(
    location.state?.jobDescription || ""
  );
  const [suggestedRoles, setSuggestedRoles] = useState([]);
  const queryParams = new URLSearchParams(location.search);
  const [tab, setTab] = useState(queryParams.get("tab") || "score");

  useEffect(() => {
    const t = new URLSearchParams(location.search).get("tab");
    if (t) setTab(t);
  }, [location.search]);

  useEffect(() => {
    if (analysis?.suggestedRoles?.length) {
      setSuggestedRoles(analysis.suggestedRoles);
    }
    if (analysis?.targetRole && !targetRole) {
      setTargetRole(analysis.targetRole);
    }
  }, [analysis, targetRole]);

  async function runAnalyze() {
    try {
      await analyze.mutateAsync({
        versionId: activeVersionId,
        targetRole: targetRole.trim() || undefined,
        jobDescription: jobDescription.trim() || undefined,
      });
    } catch {
      /* surfaced below */
    }
  }

  async function runApplyRewrites(rewriteIds) {
    if (!analysis?._id || applyRewrites.isPending || analyze.isPending) return;
    try {
      const res = await applyRewrites.mutateAsync({
        analysisId: analysis._id,
        rewriteIds: rewriteIds.length ? rewriteIds : undefined,
        targetRole: targetRole.trim() || undefined,
      });
      if (res?.version?._id) {
        const newVersionId = res.version._id;
        setActiveVersionId(newVersionId);
        setTab("score");
        // Auto-analyze the new version with the same target role so the user
        // immediately sees whether their rewrites moved the score.
        try {
          await analyze.mutateAsync({
            versionId: newVersionId,
            targetRole: targetRole.trim() || undefined,
            jobDescription: jobDescription.trim() || undefined,
          });
        } catch {
          /* surfaced via analyze.error inside the Run analysis card */
        }

      }
    } catch {
      /* surfaced inside the card */
    }
  }

  async function runSuggestRoles() {
    if (jobDescription.trim().length < 20) return;
    try {
      const result = await suggestRoles.mutateAsync(jobDescription.trim());
      setSuggestedRoles(result.roles || []);
      if (result.roles?.[0] && !targetRole.trim()) {
        setTargetRole(result.roles[0]);
      }
    } catch {
      /* surfaced by the mutation toast */
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/3 rounded-2xl" />
        <Skeleton className="h-[400px] rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={FileText}
        title="Resume not found"
        description={error.message}
        action={
          <Button variant="outline" onClick={() => nav("/resumes")}>
            Back to resumes
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={resume?.title || "Resume"}
        description={
          resume
            ? `Updated ${relativeTime(resume.updatedAt)} · ${versions.length} version${
                versions.length > 1 ? "s" : ""
              }`
            : ""
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" onClick={() => nav("/resumes")}>
              <ArrowLeft size={14} /> All resumes
            </Button>
            <Button
              variant={tab === "versions" ? "accent" : "outline"}
              onClick={() => setTab("versions")}
              className="gap-1.5"
            >
              <Layers size={14} /> Versions ({versions.length})
            </Button>
            <Button variant="outline" onClick={() => nav(`/resumes/${id}/keyword-intelligence`)}>
              <Search size={14} /> Keyword intelligence
            </Button>
            <Button variant="accent" onClick={() => nav(`/resumes/${id}/roadmap`)}>
              <Route size={14} /> Build My Career Roadmap
            </Button>
            <Button
              variant="outline"
              onClick={() => nav(`/resumes/${id}/export`)}
            >
              <Download size={14} /> Export PDF
            </Button>
          </div>
        }
      />

      <Card>
        <div className="flex flex-wrap items-end gap-4 justify-between">
          <div className="space-y-2">
            <CardTitle className="text-base">Run analysis</CardTitle>
            <CardDescription>
              Score this version with Gemini and get issues, strengths, and rewrites.
            </CardDescription>
            <VersionSwitcher
              versions={versions}
              activeId={activeVersionId}
              onChange={setActiveVersionId}
            />
          </div>
          <div className="flex flex-col gap-3 flex-1 min-w-[280px] max-w-[620px]">
            <Input
              placeholder="Target role (optional, e.g. Senior Frontend Engineer)"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />
            <textarea
              className="min-h-28 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] resize-y"
              placeholder="Paste the complete job description (optional). The analysis will match keywords and rewrite only facts supported by your CV."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              maxLength={12000}
              aria-label="Job description"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={runSuggestRoles}
                disabled={suggestRoles.isPending || jobDescription.trim().length < 20}
              >
                {suggestRoles.isPending ? (
                  <><Loader2 size={13} className="animate-spin" /> Finding roles…</>
                ) : (
                  "Suggest technical roles"
                )}
              </Button>
              {suggestedRoles.map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => setTargetRole(role)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    targetRole === role
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                      : "border-[var(--border)] text-[var(--ink-muted)] hover:border-[var(--accent)]"
                  }`}
                >
                  {role}
                </button>
              ))}
              {targetRole.trim() && analysis?._id && (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => runApplyRewrites([])}
                  disabled={applyRewrites.isPending}
                >
                  {applyRewrites.isPending ? (
                    <><Loader2 size={13} className="animate-spin" /> Creating version…</>
                  ) : (
                    "Create tailored PDF version"
                  )}
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-[var(--ink-muted)] flex items-center gap-1">
                <ClipboardPaste size={13} /> Originality-safe wording; no invented experience
              </span>
              <Button
                variant="accent"
                size="lg"
                onClick={runAnalyze}
                disabled={analyze.isPending || !activeVersionId}
                className="shrink-0"
              >
                {analyze.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Analyzing…
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> Analyze
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        {analyze.error && (
          <div className="mt-4 text-xs text-[var(--danger)] bg-[#F8E3E0] rounded-xl px-3 py-2">
            {analyze.error.message}
          </div>
        )}
      </Card>

      {tab === "versions" ? (
        <CVVersionsPanel
          versions={versions}
          activeVersionId={activeVersionId}
          onSelectVersion={(vId) => {
            setActiveVersionId(vId);
          }}
          onOpenDiff={(vId) => {
            setTab("diff");
          }}
          onExport={(vId) => {
            nav(`/resumes/${id}/export`);
          }}
          onCreateVersion={() => {
            setTab("rewrites");
          }}
          resumeTitle={resume?.title}
        />
      ) : (
        <>
          {!analysis && !analysisQuery.isLoading && (
            <EmptyState
              icon={Sparkles}
              title="No analysis yet for this version"
              description="Click Analyze above to score this resume version with AI, or explore this CV's versions."
              action={
                <Button variant="outline" onClick={() => setTab("versions")} className="gap-1.5">
                  <Layers size={14} /> View CV Versions ({versions.length})
                </Button>
              }
            />
          )}

          {analysisQuery.isLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <Skeleton className="h-[280px] rounded-3xl" />
              <Skeleton className="h-[280px] rounded-3xl lg:col-span-2" />
            </div>
          )}

          {analysis && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-4">
                  <AtsGauge score={analysis.atsScore} delta={0} />
                </div>
                <div className="lg:col-span-5">
                  <ScoreBreakdown
                    breakdown={analysis.scoreBreakdown}
                    compatibilityBreakdown={analysis.compatibilityBreakdown}
                  />
                </div>
                <div className="lg:col-span-3">
                  <Card className="h-full flex flex-col">
                    <CardHeader>
                      <div>
                        <CardTitle className="text-base">Verdict</CardTitle>
                        <CardDescription className="mt-1">
                          AI overall summary
                        </CardDescription>
                      </div>
                      <Badge tone="accent">{analysis.model}</Badge>
                    </CardHeader>
                    <p className="text-sm text-[var(--ink)] leading-relaxed">
                      {analysis.summary}
                    </p>
                  </Card>
                </div>
              </div>

              <AtsImprovementPlan
                analysis={analysis}
                onOpenIssues={() => setTab("score")}
                onAnalyze={runAnalyze}
              />

              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  <TabsTrigger value="score">Issues</TabsTrigger>
                  <TabsTrigger value="strengths">Strengths</TabsTrigger>
                  <TabsTrigger value="keywords">Keywords</TabsTrigger>
                  <TabsTrigger value="rewrites">Rewrites</TabsTrigger>
                  <TabsTrigger value="versions" className="gap-1.5">
                    <Layers size={13} /> Versions ({versions.length})
                  </TabsTrigger>
                  {analysis.compatibilityBreakdown && (
                    <TabsTrigger value="compatibility">Job compatibility</TabsTrigger>
                  )}
                  {analysis?.originalityIssues?.length > 0 && (
                    <TabsTrigger value="originality">Originality</TabsTrigger>
                  )}
                  {versions.length >= 2 && (
                    <TabsTrigger value="diff">Diff</TabsTrigger>
                  )}
                </TabsList>

                <div className="mt-5">
                  <TabsContent value="score">
                    <IssuesList issues={analysis.issues} />
                  </TabsContent>
                  <TabsContent value="strengths">
                    <StrengthsList strengths={analysis.strengths} />
                  </TabsContent>
                  <TabsContent value="keywords">
                    <KeywordChips
                      present={analysis.keywordsPresent}
                      missing={analysis.keywordsMissing}
                    />
                  </TabsContent>
                  <TabsContent value="rewrites">
                    <BulletRewrites
                      rewrites={analysis.bulletRewrites}
                      onApply={runApplyRewrites}
                      isApplying={applyRewrites.isPending}
                      error={applyRewrites.error?.message}
                    />
                  </TabsContent>
                  <TabsContent value="versions">
                    <CVVersionsPanel
                      versions={versions}
                      activeVersionId={activeVersionId}
                      onSelectVersion={(vId) => {
                        setActiveVersionId(vId);
                      }}
                      onOpenDiff={(vId) => {
                        setTab("diff");
                      }}
                      onExport={(vId) => {
                        nav(`/resumes/${id}/export`);
                      }}
                      onCreateVersion={() => {
                        setTab("rewrites");
                      }}
                      resumeTitle={resume?.title}
                    />
                  </TabsContent>
                  {analysis.compatibilityBreakdown && (
                    <TabsContent value="compatibility">
                      <CompatibilityPanel
                        breakdown={analysis.compatibilityBreakdown}
                        matches={analysis.keywordMatches}
                        recommendations={analysis.improvementRecommendations}
                        rubricVersion={analysis.scoringRubricVersion}
                      />
                    </TabsContent>
                  )}
                  {analysis.originalityIssues?.length > 0 && (
                    <TabsContent value="originality">
                      <Card>
                        <CardHeader>
                          <div>
                            <CardTitle className="text-base">Originality wording check</CardTitle>
                            <CardDescription className="mt-1">
                              These are generic or potentially copied-sounding phrases, not an internet plagiarism verdict.
                            </CardDescription>
                          </div>
                        </CardHeader>
                        <div className="space-y-3">
                          {analysis.originalityIssues.map((issue, index) => (
                            <div key={`${issue.phrase}-${index}`} className="rounded-2xl border border-[var(--border)] p-4">
                              <div className="text-sm font-medium text-[var(--ink)]">“{issue.phrase}”</div>
                              <div className="mt-1 text-xs text-[var(--ink-muted)]">{issue.reason}</div>
                              <div className="mt-2 text-sm text-[var(--accent-strong)]">{issue.suggestion}</div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </TabsContent>
                  )}
                  <TabsContent value="diff">
                    <DiffView resumeId={id} versions={versions} />
                  </TabsContent>
                </div>
              </Tabs>
            </>
          )}
        </>
      )}

      {activeVersion && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base">Parsed Sections ({activeVersion.label})</CardTitle>
              <CardDescription className="mt-1">
                Quick preview of what we extracted from the PDF
              </CardDescription>
            </div>
          </CardHeader>
          <ParsedSectionsPreview version={activeVersion} />
        </Card>
      )}
    </div>
  );
}

function ParsedSectionsPreview({ version }) {
  const s = version.parsedSections || {};
  const b = s.basics || {};
  const [expanded, setExpanded] = useState({});
  const [showRaw, setShowRaw] = useState(false);
  const sections = [
    ["summary", "Professional Summary", s.summary],
    ["experience", "Work Experience", s.experience],
    ["projects", "Projects", s.projects],
    ["education", "Education", s.education],
    ["skills", "Technical Skills", s.skills],
    ["certifications", "Certifications", s.certifications],
    ["languages", "Languages", s.languages],
    ["interests", "Additional Information", s.interests],
  ].filter(([, , value]) => Array.isArray(value) ? value.length > 0 : Boolean(value?.trim?.() || value));
  const toggle = (key) => setExpanded((current) => ({ ...current, [key]: !current[key] }));

  return (
    <div className="space-y-4 text-sm">
      {(b.name || b.title || b.email) && (
        <div className="pb-4 border-b border-[var(--border)]">
          {b.name && (
            <div className="font-display text-lg font-semibold tracking-tight text-[var(--ink)]">
              {b.name}
            </div>
          )}
          {b.title && (
            <div className="text-[var(--accent-strong)] text-sm">{b.title}</div>
          )}
          <div className="text-xs text-[var(--ink-muted)] mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {b.email && <span>{b.email}</span>}
            {b.phone && <span>{b.phone}</span>}
            {b.location && <span>{b.location}</span>}
            {(b.links || []).map((l, i) => (
              <span key={i}>{l.label}</span>
            ))}
          </div>
        </div>
      )}

      {sections.length > 0 ? (
        <div className="space-y-2">
          <div className="text-[11px] text-[var(--ink-muted)]">{sections.length} structured section{sections.length === 1 ? "" : "s"} detected</div>
          {sections.map(([key, title, value]) => (
            <div key={key} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] overflow-hidden">
              <button type="button" onClick={() => toggle(key)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                <span className="font-medium text-[var(--ink)]">{title}</span>
                {expanded[key] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              {expanded[key] && <div className="border-t border-[var(--border)] px-4 py-4"><SectionContent type={key} value={value} /></div>}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--ink-muted)]">
          No structured resume sections were detected. View the extracted text or try uploading a clearer PDF.
        </div>
      )}

      {version.rawText && (
        <div className="rounded-2xl border border-[var(--border)]">
          <button type="button" onClick={() => setShowRaw((value) => !value)} className="flex w-full items-center justify-between px-4 py-3 text-left">
            <span className="font-medium text-[var(--ink)]">Full Extracted Resume Text</span>
            {showRaw ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {showRaw && <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap border-t border-[var(--border)] px-4 py-4 text-xs leading-5 text-[var(--ink-muted)]">{version.rawText}</pre>}
        </div>
      )}
    </div>
  );
}

function SectionContent({ type, value }) {
  if (type === "summary") return <p className="whitespace-pre-wrap leading-6 text-[var(--ink)]">{value}</p>;
  if (type === "skills" || type === "languages" || type === "interests") {
    return <div className="flex flex-wrap gap-1.5">{value.map((item, index) => <Badge key={index} tone={type === "skills" ? "accent" : "neutral"}>{item}</Badge>)}</div>;
  }
  if (type === "experience") return <div className="space-y-4">{value.map((item, index) => <div key={index}><div className="font-medium text-[var(--ink)]">{item.role || item.company || "Experience"}</div><div className="text-xs text-[var(--ink-muted)]">{[item.company, item.period, item.location].filter(Boolean).join(" · ")}</div><ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--ink)]">{(item.bullets || []).map((bullet, bulletIndex) => <li key={bulletIndex}>{bullet}</li>)}</ul></div>)}</div>;
  if (type === "projects") return <div className="space-y-4">{value.map((item, index) => <div key={index}><div className="font-medium text-[var(--ink)]">{item.name || "Project"}</div>{item.tech?.length > 0 && <div className="mt-1 text-xs text-[var(--accent-strong)]">{item.tech.join(" · ")}</div>}<p className="mt-2 whitespace-pre-wrap leading-5 text-[var(--ink)]">{item.description}</p></div>)}</div>;
  if (type === "education") return <div className="space-y-3">{value.map((item, index) => <div key={index}><div className="font-medium text-[var(--ink)]">{item.degree || item.fieldOfStudy || "Education"}</div><div className="text-xs text-[var(--ink-muted)]">{[item.institution, item.period, item.location].filter(Boolean).join(" · ")}</div>{item.bullets?.length > 0 && <ul className="mt-2 list-disc pl-5 text-[var(--ink)]">{item.bullets.map((bullet, bulletIndex) => <li key={bulletIndex}>{bullet}</li>)}</ul>}</div>)}</div>;
  return <ul className="list-disc space-y-1 pl-5 text-[var(--ink)]">{value.map((item, index) => <li key={index}>{typeof item === "string" ? item : item.name}</li>)}</ul>;
}

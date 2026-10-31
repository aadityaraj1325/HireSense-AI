const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const Resume = require("../models/Resume");
const ResumeVersion = require("../models/ResumeVersion");
const Analysis = require("../models/Analysis");

const router = express.Router();
router.use(requireAuth);

router.get(
    "/",
    asyncHandler(async (req, res) => {
        const userId = req.user._id;

        const resumes = await Resume.find({ userId }).sort({ updatedAt: -1 }).lean();
        const resumeIds = resumes.map((r) => r._id);

        const [rewriteCount, analysisCount] = await Promise.all([
            ResumeVersion.countDocuments({
                resumeId: { $in: resumeIds },
                sourceType: "rewrite",
            }),
            Analysis.countDocuments({ userId }),
        ]);

        const latestResumeMeta = resumes[0] || null;

        let latestResume = null;
        let scoreSeries = [];
        let versionStack = [];

        if (latestResumeMeta) {
            const versions = await ResumeVersion.find({
                resumeId: latestResumeMeta._id,
            })
                .sort({ versionNumber: 1 })
                .lean();

            const analyses = await Analysis.find({ resumeId: latestResumeMeta._id })
                .select("_id atsScore scoreBreakdown keywordsPresent keywordsMissing issues bulletRewrites targetRole jobDescription versionId createdAt")
                .sort({ createdAt: 1 })
                .lean();
            const versionById = new Map(versions.map((v) => [v._id.toString(), v]));
            const versionsWithScores = analyses.map((analysis) => {
                const version = versionById.get(analysis.versionId.toString());
                return {
                    id: version?._id || analysis.versionId,
                    analysisId: analysis._id,
                    label: version?.label || `Analysis ${analysis.createdAt.toISOString().slice(0, 10)}`,
                    versionNumber: version?.versionNumber || 0,
                    sourceType: version?.sourceType || "upload",
                    createdAt: version?.createdAt || analysis.createdAt,
                    analysis,
                };
            });

            latestResume = {
                id: latestResumeMeta._id,
                title: latestResumeMeta.title,
                latestVersionNumber: latestResumeMeta.latestVersionNumber,
                updatedAt: latestResumeMeta.updatedAt,
                currentVersionId: latestResumeMeta.currentVersionId,
            };

            scoreSeries = versionsWithScores
                .filter((v) => v.analysis)
                .map((v, index, series) => {
                    const analysis = v.analysis;
                    const previous = [...series]
                        .slice(0, index)
                        .reverse()
                        .find((item) => item.analysis);
                    const present = analysis.keywordsPresent?.length || 0;
                    const missing = analysis.keywordsMissing?.length || 0;
                    const keywordCoverage = present + missing
                        ? Math.round((present / (present + missing)) * 100)
                        : null;
                    const breakdown = analysis.scoreBreakdown || {};
                    const resumeQuality = ["formatting", "impact", "clarity"].every(
                        (key) => breakdown[key] != null
                    )
                        ? Math.round(
                            ((breakdown.formatting + breakdown.impact + breakdown.clarity) / 75) * 100
                        )
                        : null;
                    const scoreChange = previous?.analysis
                        ? analysis.atsScore - previous.analysis.atsScore
                        : null;
                    return {
                        label: v.label,
                        versionNumber: v.versionNumber,
                        pointId: v.analysisId || `${v.id}-${index}`,
                        versionId: v.id,
                        analysisId: v.analysisId,
                        at: analysis.createdAt || v.createdAt,
                        atsScore: analysis.atsScore,
                        score: analysis.atsScore,
                        keywordCoverage,
                        resumeQuality,
                        contentImpact: breakdown.impact != null ? breakdown.impact * 4 : null,
                        radar: {
                            keywordOptimization: breakdown.keywords != null ? breakdown.keywords * 4 : null,
                            formatting: breakdown.formatting != null ? breakdown.formatting * 4 : null,
                            contentImpact: breakdown.impact != null ? breakdown.impact * 4 : null,
                            clarity: breakdown.clarity != null ? breakdown.clarity * 4 : null,
                            jobRelevance:
                                (analysis.targetRole || analysis.jobDescription) && breakdown.keywords != null
                                    ? breakdown.keywords * 4
                                    : null,
                        },
                        scoreChange,
                        previousScore: previous?.analysis?.atsScore ?? null,
                        improvements: [
                            scoreChange != null && scoreChange !== 0
                                ? `ATS score ${scoreChange > 0 ? "+" : ""}${scoreChange} points`
                                : null,
                            present > (previous?.analysis?.keywordsPresent?.length || 0)
                                ? `${present - (previous?.analysis?.keywordsPresent?.length || 0)} more keywords matched`
                                : null,
                            v.sourceType === "rewrite" ? "AI rewrite created" : null,
                        ].filter(Boolean),
                        keywordsPresent: analysis.keywordsPresent || [],
                        keywordsMissing: analysis.keywordsMissing || [],
                        issues: analysis.issues || [],
                        bulletRewrites: analysis.bulletRewrites || [],
                        sourceType: v.sourceType,
                    };
                });

            const last3 = versionsWithScores.slice(-3);
            versionStack = last3.map((v, i, arr) => {
                const prev = arr[i - 1];
                const delta =
                    v.analysis?.atsScore != null && prev?.analysis?.atsScore != null
                        ? v.analysis.atsScore - prev.analysis.atsScore
                        : 0;
                return {
                    id: v.id,
                    label: v.label,
                    title:
                        v.sourceType === "upload"
                            ? "Upload"
                            : v.sourceType === "rewrite"
                                ? "Rewrite pass"
                                : v.label,
                    score: v.analysis?.atsScore ?? 0,
                    delta,
                };
            });
        }

        // KPIs derived from history
        const allAnalyses = await Analysis.find({ userId })
            .select("atsScore keywordsPresent keywordsMissing issues bulletRewrites summary createdAt resumeId")
            .sort({ createdAt: 1 })
            .lean();

        const latestAnalysis = allAnalyses[allAnalyses.length - 1] || null;
        const prevAnalysis = allAnalyses[allAnalyses.length - 2] || null;
        const keywordTotal =
            (latestAnalysis?.keywordsPresent?.length || 0) +
            (latestAnalysis?.keywordsMissing?.length || 0);
        const keywordReadiness = keywordTotal
            ? Math.round(((latestAnalysis?.keywordsPresent?.length || 0) / keywordTotal) * 100)
            : null;

        const scoreSpark = allAnalyses.slice(-10).map((a) => ({ v: a.atsScore }));
        const versionsSpark = resumes
            .slice(0, 10)
            .reverse()
            .map((r) => ({ v: r.latestVersionNumber || 1 }));
        const keywordsSpark = allAnalyses
            .slice(-10)
            .map((a) => ({ v: (a.keywordsPresent || []).length }));
        const issuesSpark = allAnalyses
            .slice(-10)
            .map((a) => ({ v: (a.issues || []).length }));

        const kpi = {
            atsScore: {
                value: latestAnalysis?.atsScore ?? null,
                delta:
                    latestAnalysis && prevAnalysis
                        ? latestAnalysis.atsScore - prevAnalysis.atsScore
                        : null,
                spark: scoreSpark,
            },
            versions: {
                value: resumes.reduce((sum, r) => sum + (r.latestVersionNumber || 1), 0),
                delta: null,
                spark: versionsSpark,
            },
            issuesIdentified: {
                value: latestAnalysis ? latestAnalysis.issues?.length || 0 : null,
                delta:
                    latestAnalysis && prevAnalysis
                        ? (latestAnalysis.issues?.length || 0) -
                        (prevAnalysis.issues?.length || 0)
                        : null,
                spark: issuesSpark,
            },
            keywordsMatched: {
                value: latestAnalysis ? latestAnalysis.keywordsPresent?.length || 0 : null,
                total: latestAnalysis ? keywordTotal : null,
                delta:
                    latestAnalysis && prevAnalysis
                        ? (latestAnalysis.keywordsPresent?.length || 0) -
                        (prevAnalysis.keywordsPresent?.length || 0)
                        : null,
                spark: keywordsSpark,
            },
        };

        const readinessSignals = [latestAnalysis?.atsScore, keywordReadiness].filter(
            (value) => value != null
        );
        const careerReadiness = readinessSignals.length
            ? Math.round(readinessSignals.reduce((sum, value) => sum + value, 0) / readinessSignals.length)
            : null;

        const resumeMap = new Map(resumes.map((r) => [r._id.toString(), r]));

        const [recentVersions, recentAnalyses] = await Promise.all([
            ResumeVersion.find({ resumeId: { $in: resumeIds } })
                .sort({ createdAt: -1 })
                .limit(10)
                .select("resumeId label versionNumber sourceType createdAt")
                .lean(),
            Analysis.find({ userId })
                .sort({ createdAt: -1 })
                .limit(10)
                .select("resumeId versionId atsScore createdAt")
                .lean(),
        ]);

        const events = [];

        for (const r of resumes.slice(0, 10)) {
            events.push({
                id: `r-${r._id}`,
                type: "upload",
                title: `${r.title} uploaded`,
                subtitle: "Parsed and version V1 created",
                label: "V1",
                at: r.createdAt,
                resumeId: r._id,
            });
        }

        for (const v of recentVersions) {
            if (v.sourceType !== "rewrite") continue;
            const resume = resumeMap.get(v.resumeId.toString());
            events.push({
                id: `v-${v._id}`,
                type: "rewrite",
                title: `${v.label} created for ${resume?.title || "resume"}`,
                subtitle: "Rewrites applied",
                label: `${v.label} created`,
                at: v.createdAt,
                resumeId: v.resumeId,
            });
        }

        for (const a of recentAnalyses) {
            const resume = resumeMap.get(a.resumeId.toString());
            events.push({
                id: `a-${a._id}`,
                type: "analyze",
                title: `Analysis complete on ${resume?.title || "resume"}`,
                subtitle: `ATS score ${a.atsScore} / 100`,
                label: `${a.atsScore}`,
                at: a.createdAt,
                resumeId: a.resumeId,
            });
        }

        const activity = events
            .sort((a, b) => new Date(b.at) - new Date(a.at))
            .slice(0, 8);

        res.json({
            totals: {
                resumes: resumes.length,
                rewrites: rewriteCount,
                analyses: analysisCount,
                exports: 0,
            },
            latestResume,
            scoreSeries,
            versionStack,
            kpi,
            careerReadiness,
            latestAnalysis: latestAnalysis
                ? {
                    atsScore: latestAnalysis.atsScore,
                    keywordsPresent: latestAnalysis.keywordsPresent || [],
                    keywordsMissing: latestAnalysis.keywordsMissing || [],
                    issues: latestAnalysis.issues || [],
                    bulletRewrites: latestAnalysis.bulletRewrites || [],
                    summary: latestAnalysis.summary || "",
                    createdAt: latestAnalysis.createdAt,
                }
                : null,
            activity,
        });
    })
);

module.exports = router;
const express = require("express");
const { z } = require("zod");
const mongoose = require("mongoose");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { uploadPdf } = require("../middleware/upload");

const Resume = require("../models/Resume");
const ResumeVersion = require("../models/ResumeVersion");

const { analyzeLimiter } = require('../middleware/rateLimit');
const Analysis = require("../models/Analysis");
const { analyzeResume, suggestRoles, extractJobRequirements } = require("../services/geminiService");
const { calculateCompatibility } = require("../services/atsEngine");
const { sumBreakdown } = require("../services/scoreService");

const { diffText, summarize } = require("../services/diffService");
const {
    applyRewritesToText,
    patchTargetRole,
    patchBulletsInSections,
    looksEmpty,
    locateRewrite,
} = require("../services/rewriteService");


const { extractText } = require("../services/pdfService");
const { parseResume: parseStructured } = require("../services/structuredParser");
const env = require("../config/env");

const router = express.Router();
router.use(requireAuth);

const objectIdSchema = z
    .string()
    .refine((v) => mongoose.isValidObjectId(v), { message: "Invalid id" });

const idParam = z.object({ id: objectIdSchema });

async function loadOwnedResume(req) {
    const resume = await Resume.findOne({
        _id: req.params.id,
        userId: req.user._id,
    });
    if (!resume) throw ApiError.notFound("Resume not found");
    return resume;
}

async function loadVersion(resumeId, versionId) {
    const version = await ResumeVersion.findOne({ _id: versionId, resumeId });
    if (!version) throw ApiError.notFound("Version not found");
    return version;
}

// Upload & create resume
router.post(
    "/",
    uploadPdf("file"),
    asyncHandler(async (req, res) => {
        const { text, meta } = await extractText(req.file.buffer);
        const parsedSections = await parseStructured(text);
        if (!env.isProd) {
            const detectedSections = Object.entries(parsedSections)
                .filter(([, value]) => Array.isArray(value) ? value.length : value && typeof value === "object" ? Object.values(value).some(Boolean) : Boolean(value))
                .map(([key]) => key);
            console.log(`[resume upload] extracted ${text.length} characters; sections: ${detectedSections.join(", ") || "none"}`);
        }

        const title =
            (req.body.title || "").trim() ||
            req.file.originalname.replace(/\.pdf$/i, "") ||
            "Untitled Resume";

        const resume = await Resume.create({
            userId: req.user._id,
            title,
            latestVersionNumber: 1,
        });

        const version = await ResumeVersion.create({
            resumeId: resume._id,
            versionNumber: 1,
            label: "V1",
            rawText: text,
            parsedSections,
            sourceType: "upload",
            parentVersionId: null,
        });

        resume.currentVersionId = version._id;
        await resume.save();

        res.status(201).json({ resume, version, meta });
    })
);

// Get all user resumes
router.get(
    "/",
    asyncHandler(async (req, res) => {
        const resumes = await Resume.find({ userId: req.user._id })
            .sort({ updatedAt: -1 })
            .lean();
        res.json({ resumes });
    })
);

// Get single resume with version history
router.get(
    "/:id",
    validate(idParam, "params"),
    asyncHandler(async (req, res) => {
        const resume = await loadOwnedResume(req);
        const versions = await ResumeVersion.find({ resumeId: resume._id })
            .populate("latestAnalysisId", "atsScore targetRole model createdAt")
            .sort({ versionNumber: 1 })
            .lean();
        res.json({ resume, versions });
    })
);

// Get specific version of a resume
router.get(
    "/:id/versions/:versionId",
    validate(
        z.object({ id: objectIdSchema, versionId: objectIdSchema }),
        "params"
    ),
    asyncHandler(async (req, res) => {
        const resume = await loadOwnedResume(req);
        const version = await loadVersion(resume._id, req.params.versionId);
        res.json({ version });
    })
);

// Delete resume
router.delete(
    "/:id",
    validate(idParam, "params"),
    asyncHandler(async (req, res) => {
        const resume = await loadOwnedResume(req);
        await ResumeVersion.deleteMany({ resumeId: resume._id });
        await Analysis.deleteMany({ resumeId: resume._id });
        await resume.deleteOne();
        res.json({ ok: true });
    })
);

const analyzeBody = z.object({
    versionId: objectIdSchema.optional(),
    targetRole: z.string().trim().max(120).optional(),
    jobDescription: z.string().trim().max(12000).optional(),
});

const suggestRolesBody = z.object({
    jobDescription: z.string().trim().min(20).max(12000),
});

router.post(
    "/suggest-roles",
    validate(suggestRolesBody),
    asyncHandler(async (req, res) => {
        const roles = await suggestRoles(req.body.jobDescription);
        res.json({ roles });
    })
);

// Analyze resume / version
router.post(
    "/:id/analyze",
    validate(idParam, "params"),
    validate(analyzeBody),
    asyncHandler(async (req, res) => {
        const resume = await loadOwnedResume(req);

        const versionId = req.body.versionId || resume.currentVersionId;
        if (!versionId) throw ApiError.badRequest("No version to analyze");
        const version = await loadVersion(resume._id, versionId);

        const { analysis, model, promptTokens, responseTokens } =
            await analyzeResume({
                rawText: version.rawText,
                targetRole: req.body.targetRole,
                jobDescription: req.body.jobDescription,
            });

        let compatibility = null;
        let requirementsModel = null;
        let requirementsTokens = 0;
        if (req.body.jobDescription?.trim()) {
            const extracted = await extractJobRequirements(req.body.jobDescription);
            compatibility = calculateCompatibility({
                parsedSections: version.parsedSections,
                rawText: version.rawText,
                jobRequirements: extracted.requirements,
                jobDescription: req.body.jobDescription,
            });
            requirementsModel = extracted.model;
            requirementsTokens = extracted.promptTokens + extracted.responseTokens;
        }

        const saved = await Analysis.create({
            userId: req.user._id,
            resumeId: resume._id,
            versionId: version._id,
            atsScore: compatibility?.score ?? sumBreakdown(analysis.scoreBreakdown),
            scoreBreakdown: analysis.scoreBreakdown,
            issues: analysis.issues,
            strengths: analysis.strengths,
            bulletRewrites: analysis.bulletRewrites.map((rewrite) => {
                const anchor = locateRewrite(rewrite, version.parsedSections);
                return {
                    ...rewrite,
                    resumeId: resume._id,
                    sourceVersionId: version._id,
                    fieldPath: anchor?.fieldPath,
                    originalFingerprint: anchor?.fingerprint,
                    requiresConfirmation: false,
                };
            }),
            keywordsPresent: analysis.keywordsPresent,
            keywordsMissing: analysis.keywordsMissing,
            summary: analysis.summary,
            targetRole: req.body.targetRole || "",
            jobDescription: req.body.jobDescription || "",
            originalityIssues: analysis.originalityIssues,
            suggestedRoles: analysis.suggestedRoles,
            model,
            promptTokens,
            responseTokens,
            scoringRubricVersion: compatibility?.rubricVersion || "",
            atsScoreSource: compatibility ? "deterministic" : "gemini",
            jobRequirements: compatibility ? {
                ...compatibility.jobRequirements,
                model: requirementsModel,
                tokens: requirementsTokens,
            } : null,
            compatibilityBreakdown: compatibility?.breakdown || null,
            keywordMatches: compatibility?.keywordMatches || [],
            missingRequirements: compatibility?.missingRequirements || [],
            improvementRecommendations: compatibility?.recommendations || [],
        });

        version.latestAnalysisId = saved._id;
        await version.save();

        res.status(201).json({ analysis: saved });
    })
);

// Get all analyses for a resume
router.get(
    "/:id/analyses",
    validate(idParam, "params"),
    asyncHandler(async (req, res) => {
        const resume = await loadOwnedResume(req);
        const analyses = await Analysis.find({ resumeId: resume._id })
            .sort({ createdAt: -1 })
            .lean();
        res.json({ analyses });
    })
);

router.get(
    "/:id/keyword-intelligence",
    validate(idParam, "params"),
    validate(z.object({ versionId: objectIdSchema.optional() }), "query"),
    asyncHandler(async (req, res) => {
        const resume = await loadOwnedResume(req);
        const versionId = req.query.versionId || resume.currentVersionId;
        if (!versionId) {
            return res.json({ analysis: null, matches: [], recommendations: [] });
        }
        await loadVersion(resume._id, versionId);
        const analysis = await Analysis.findOne({
            resumeId: resume._id,
            versionId,
        }).sort({ createdAt: -1 }).lean();
        res.json({
            analysis,
            matches: analysis?.keywordMatches || [],
            recommendations: analysis?.improvementRecommendations || [],
        });
    })
);

// Get analysis for specific version
router.get(
    "/:id/versions/:versionId/analysis",
    validate(
        z.object({ id: objectIdSchema, versionId: objectIdSchema }),
        "params"
    ),
    asyncHandler(async (req, res) => {
        const resume = await loadOwnedResume(req);
        const version = await loadVersion(resume._id, req.params.versionId);
        const analysis = await Analysis.findOne({
            resumeId: resume._id,
            versionId: version._id,
        })
            .sort({ createdAt: -1 })
            .lean();
        res.json({ analysis: analysis || null });
    })
);

const rewriteBody = z.object({
    analysisId: objectIdSchema,
    rewriteIds: z.array(objectIdSchema).optional(),
    label: z.string().trim().max(40).optional(),
    targetRole: z.string().trim().max(120).optional(),
});

// Rewrite resume based on selected analysis bullet rewrites
router.post(
    "/:id/rewrite",
    validate(idParam, "params"),
    validate(rewriteBody),
    asyncHandler(async (req, res) => {
        const resume = await loadOwnedResume(req);

        const analysis = await Analysis.findOne({
            _id: req.body.analysisId,
            resumeId: resume._id,
        });
        if (!analysis) throw ApiError.notFound("Analysis not found");

        const baseVersion = await loadVersion(resume._id, analysis.versionId);

        const selected = req.body.rewriteIds?.length
            ? analysis.bulletRewrites.filter((r) =>
                req.body.rewriteIds.includes(r._id.toString())
            )
            : analysis.bulletRewrites;
        const uniqueSelected = [...new Map(
            selected.map((rewrite) => [`${rewrite.original}\u0000${rewrite.rewritten}`, rewrite])
        ).values()];
        const staleSuggestion = uniqueSelected.find(
            (rewrite) => rewrite.sourceVersionId &&
                rewrite.sourceVersionId.toString() !== baseVersion._id.toString()
        );
        if (staleSuggestion) {
            throw ApiError.conflict("These suggestions belong to a different resume version", {
                code: "RESUME_VERSION_CONFLICT",
                rewriteId: staleSuggestion._id,
                sourceVersionId: staleSuggestion.sourceVersionId,
                currentVersionId: baseVersion._id,
            });
        }

        if (!uniqueSelected.length && !req.body.targetRole?.trim() && !analysis.targetRole?.trim()) {
            throw ApiError.badRequest("Choose a role or select at least one rewrite");
        }

        const rewriteResult = applyRewritesToText(
            baseVersion.rawText,
            uniqueSelected,
            baseVersion.parsedSections
        );
        const newRaw = rewriteResult.text;

        const patchedFromBase = patchBulletsInSections(
            baseVersion.parsedSections,
            uniqueSelected
        );
        const reparsed = await parseStructured(newRaw);
        const requestedRole = req.body.targetRole?.trim() || analysis.targetRole;
        const finalParsed = patchTargetRole(
            looksEmpty(reparsed)
                ? patchedFromBase
                : patchBulletsInSections(reparsed, uniqueSelected),
            requestedRole
        );
        if (looksEmpty(finalParsed) || !newRaw.trim()) {
            throw ApiError.badRequest("The rewritten resume is empty or could not be parsed.");
        }

        const nextNumber = resume.latestVersionNumber + 1;

        const newVersion = await ResumeVersion.create({
            resumeId: resume._id,
            versionNumber: nextNumber,
            label: req.body.label?.trim() ||
                (requestedRole ? `${requestedRole} · V${nextNumber}` : `V${nextNumber}`),
            rawText: newRaw,
            parsedSections: finalParsed,
            sourceType: "rewrite",
            parentVersionId: baseVersion._id,
        });

        resume.latestVersionNumber = nextNumber;
        resume.currentVersionId = newVersion._id;
        await resume.save();

        res.status(201).json({
            version: newVersion,
            appliedCount: uniqueSelected.length,
            applied: rewriteResult.applied,
        });
    })
);

const diffQuery = z.object({
    from: objectIdSchema,
    to: objectIdSchema,
    mode: z.enum(["words", "lines"]).optional(),
});

// Diff two versions of a resume
router.get(
    "/:id/diff",
    validate(idParam, "params"),
    validate(diffQuery, "query"),
    asyncHandler(async (req, res) => {
        const resume = await loadOwnedResume(req);
        const [fromV, toV] = await Promise.all([
            loadVersion(resume._id, req.query.from),
            loadVersion(resume._id, req.query.to),
        ]);

        const parts = diffText(fromV.rawText, toV.rawText, req.query.mode);
        res.json({
            from: { id: fromV._id, label: fromV.label, versionNumber: fromV.versionNumber },
            to: { id: toV._id, label: toV.label, versionNumber: toV.versionNumber },
            parts,
            stats: summarize(parts),
        });
    })
);

module.exports = router;
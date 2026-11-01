const mongoose = require("mongoose");

const evidenceSubmissionSchema = new mongoose.Schema(
    {
        gapId: { type: String, required: true },
        skillName: { type: String, required: true },
        type: {
            type: String,
            enum: ["github_repo", "project_doc", "certificate", "learning_note", "code_sample", "live_demo"],
            required: true,
        },
        title: { type: String, required: true, trim: true, maxlength: 200 },
        url: { type: String, trim: true, maxlength: 500, default: "" },
        notes: { type: String, trim: true, maxlength: 2000, default: "" },
        submittedAt: { type: Date, default: Date.now },
        verified: { type: Boolean, default: false },
        confidenceLevel: { type: Number, min: 1, max: 4, default: 2 },
        confidenceLabel: {
            type: String,
            enum: [
                "Self-Reported Reference",
                "Practical Exercise / Code",
                "Working Repository / Artifact",
                "Independently Verifiable Project",
            ],
            default: "Practical Exercise / Code",
        },
        verificationFeedback: { type: String, default: "" },
        detectedArtifacts: [{ type: String }],
    },
    { _id: true }
);

const gapItemSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        skillName: { type: String, required: true },
        category: {
            type: String,
            enum: ["frontend", "backend", "dsa", "database", "devops", "ai_ml", "system_design", "general"],
            default: "general",
        },
        dimension: {
            type: String,
            enum: [
                "technical_skill",
                "practical_project",
                "problem_solving",
                "relevant_experience",
                "portfolio_evidence",
                "resume_presentation",
                "interview_preparation",
                "system_knowledge",
                "learning_prerequisite",
                "jd_alignment",
            ],
            required: true,
        },
        priority: {
            type: String,
            enum: ["critical", "high", "medium", "bonus"],
            default: "medium",
        },
        priorityScore: { type: Number, default: 50 },
        priorityReason: { type: String, required: true },
        isMandatoryInJd: { type: Boolean, default: false },
        currentEvidenceStatus: {
            type: String,
            enum: [
                "demonstrated",
                "partially_demonstrated",
                "self_reported",
                "not_evidenced",
                "in_progress",
                "not_assessed",
            ],
            default: "not_evidenced",
        },
        prerequisites: [{ type: String }],
        missingPrerequisites: [{ type: String }],
        whyItMatters: { type: String, required: true },
        resumeCheckLocation: { type: String, default: "Skills & Projects sections" },
        existingEvidenceSummary: { type: String, default: "" },
        existingEvidenceSources: [
            {
                sourceType: String,
                title: String,
                url: String,
                detail: String,
            },
        ],
        learningPath: {
            beginner: { type: String, default: "" },
            intermediate: { type: String, default: "" },
            advanced: { type: String, default: "" },
        },
        suggestedProject: {
            title: { type: String, default: "" },
            description: { type: String, default: "" },
            architecture: { type: String, default: "" },
            deliverableArtifact: { type: String, default: "" },
        },
        evidenceCriteria: { type: String, default: "" },
        suggestedResumeBullet: { type: String, default: "" },
        estimatedStudyHours: { type: Number, default: 10 },
        status: {
            type: String,
            enum: ["open", "roadmap_linked", "evidence_submitted", "verified_closed"],
            default: "open",
        },
        linkedRoadmapId: { type: mongoose.Schema.Types.ObjectId, ref: "CareerRoadmap" },
    },
    { _id: true }
);

const simulationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        selectedActionIds: [{ type: String }],
        baselineCoverage: { type: Number, required: true },
        simulatedCoverage: { type: Number, required: true },
        coverageGain: { type: Number, required: true },
        baselineReadiness: { type: Number, required: true },
        simulatedReadiness: { type: Number, required: true },
        readinessGain: { type: Number, required: true },
        estimatedEffortHours: { type: Number, required: true },
        estimatedWeeks: { type: Number, required: true },
        assumptions: [{ type: String }],
        requiredProofArtifacts: [{ type: String }],
        disclaimer: { type: String, default: "Forecast is based on product coverage rubrics and does not guarantee job offers or official ATS scores." },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: true }
);

const regressionSchema = new mongoose.Schema(
    {
        skillName: { type: String, required: true },
        gapId: { type: String },
        previousStatus: { type: String, required: true },
        currentStatus: { type: String, required: true },
        triggerSource: {
            type: String,
            enum: ["role_change", "resume_version_diff", "repo_inaccessible", "certification_expired", "jd_recalibration"],
            required: true,
        },
        description: { type: String, required: true },
        suggestedFix: { type: String, required: true },
        detectedAt: { type: Date, default: Date.now },
    },
    { _id: true }
);

const careerGapAnalysisSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        resumeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Resume",
            required: true,
        },
        versionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ResumeVersion",
        },
        targetRole: {
            type: String,
            required: true,
            trim: true,
            default: "Full Stack Engineer",
        },
        targetJobDescription: {
            type: String,
            default: "",
            maxlength: 15000,
        },
        rubricVersion: {
            type: String,
            default: "v1.2-explainable-evidence",
        },
        rubricBreakdown: {
            resumeCompatibilityScore: { type: Number, min: 0, max: 100, default: 0 },
            skillEvidenceCoverageScore: { type: Number, min: 0, max: 100, default: 0 },
            learningCompletionScore: { type: Number, min: 0, max: 100, default: 0 },
            careerReadinessEstimate: { type: Number, min: 0, max: 100, default: 0 },
            inputsUsed: [{ type: String }],
            missingInformation: [{ type: String }],
            calculationFormula: { type: String, default: "0.35 * EvidenceCoverage + 0.30 * ResumeMatch + 0.20 * RoadmapCompletion + 0.15 * ProjectProof" },
        },
        summary: {
            totalGapsDetected: { type: Number, default: 0 },
            criticalGapsCount: { type: Number, default: 0 },
            highPriorityGapsCount: { type: Number, default: 0 },
            demonstratedSkillsCount: { type: Number, default: 0 },
            partiallyDemonstratedCount: { type: Number, default: 0 },
            unassessedCount: { type: Number, default: 0 },
            topStrengthsFound: [{ type: String }],
            immediateActionFocus: { type: String, default: "" },
        },
        gaps: [gapItemSchema],
        skillDnaGraph: {
            nodes: [
                {
                    id: String,
                    label: String,
                    category: String,
                    status: String,
                    level: Number,
                    prerequisites: [String],
                    importance: String,
                    isTargetRequirement: Boolean,
                    evidenceCount: Number,
                    x: Number,
                    y: Number,
                },
            ],
            edges: [
                {
                    id: String,
                    source: String,
                    target: String,
                    animated: Boolean,
                    label: String,
                },
            ],
        },
        simulations: [simulationSchema],
        submittedEvidences: [evidenceSubmissionSchema],
        regressions: [regressionSchema],
        digitalTwinTimeline: [
            {
                date: { type: String, required: true },
                title: { type: String, required: true },
                type: { type: String, required: true },
                skillName: String,
                status: String,
                source: String,
                description: String,
            },
        ],
        copilotConversations: [
            {
                role: { type: String, enum: ["user", "assistant"], required: true },
                content: { type: String, required: true },
                timestamp: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

careerGapAnalysisSchema.index({ userId: 1, createdAt: -1 });
careerGapAnalysisSchema.index({ userId: 1, targetRole: 1 });

module.exports = mongoose.model("CareerGapAnalysis", careerGapAnalysisSchema);


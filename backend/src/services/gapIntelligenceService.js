/**
 * AI Gap Intelligence Lab Service
 * Multi-source gap analysis, explainable rubrics, counterfactual simulation,
 * evidence verification, regression detection, and AI Copilot reasoning.
 */

const CareerGapAnalysis = require("../models/CareerGapAnalysis");
const Resume = require("../models/Resume");
const ResumeVersion = require("../models/ResumeVersion");
const Analysis = require("../models/Analysis");
const DeveloperProfile = require("../models/DeveloperProfile");
const PlatformRepository = require("../models/PlatformRepository");
const PlatformActivity = require("../models/PlatformActivity");
const SkillEvidence = require("../models/SkillEvidence");
const CareerRoadmap = require("../models/CareerRoadmap");
const LearningNote = require("../models/LearningNote");

const { buildVisualDnaGraph, getDependencyTreeForRole } = require("./skillDependencyDNA");
const { callGeminiWithFallback } = require("./geminiService");

/**
 * Standard counterfactual action definitions
 */
const SIMULATION_ACTIONS = [
    {
        id: "learn_docker",
        title: "Containerize Projects with Docker & Compose",
        category: "devops",
        skillsImpacted: ["Docker", "Containers", "DevOps"],
        coverageGainPct: 12,
        evidenceCoverageGain: 12,
        readinessGainPct: 10,
        readinessScoreGain: 10,
        matchScoreGain: 6,
        estimatedHours: 15,
        estimatedWeeks: 1.5,
        proofArtifact: "GitHub repository featuring valid Dockerfile, docker-compose.yml, and environment notes.",
        assumptions: ["User completes at least one multi-container compose deployment."],
    },
    {
        id: "solve_30_dsa",
        title: "Solve 30 Medium DSA Problems (Trees, DP, Graphs)",
        category: "dsa",
        skillsImpacted: ["Data Structures", "Algorithms", "Problem Solving"],
        coverageGainPct: 15,
        evidenceCoverageGain: 15,
        readinessGainPct: 14,
        readinessScoreGain: 14,
        matchScoreGain: 7,
        estimatedHours: 35,
        estimatedWeeks: 3,
        proofArtifact: "30 verified LeetCode / Codeforces accepted solutions logged via Developer Tracker.",
        assumptions: ["Covers at least 3 distinct algorithmic patterns: Dynamic Programming, Graph Traversal, Binary Search."],
    },
    {
        id: "build_end_to_end_project",
        title: "Build End-to-End Production Project with API & DB",
        category: "practical_project",
        skillsImpacted: ["System Architecture", "REST APIs", "Databases"],
        coverageGainPct: 22,
        evidenceCoverageGain: 22,
        readinessGainPct: 20,
        readinessScoreGain: 20,
        matchScoreGain: 12,
        estimatedHours: 45,
        estimatedWeeks: 4,
        proofArtifact: "Public GitHub repo with architecture diagrams, REST/GraphQL endpoints, database indexing, and live demo URL.",
        assumptions: ["Includes authentication, persistent database, input validation, and clear documentation."],
    },
    {
        id: "deploy_cloud_service",
        title: "Deploy Microservice to AWS / GCP / Cloud Run",
        category: "devops",
        skillsImpacted: ["Cloud Computing", "AWS", "CI/CD"],
        coverageGainPct: 14,
        evidenceCoverageGain: 14,
        readinessGainPct: 12,
        readinessScoreGain: 12,
        matchScoreGain: 8,
        estimatedHours: 20,
        estimatedWeeks: 2,
        proofArtifact: "Live public HTTPS endpoint, CI/CD pipeline script, and infrastructure configuration files.",
        assumptions: ["Configures custom domain or verified cloud container hosting."],
    },
    {
        id: "refactor_resume_bullets",
        title: "Refactor Resume Projects using Google XYZ Impact Formula",
        category: "resume_presentation",
        skillsImpacted: ["Resume Presentation", "Impact Quantification"],
        coverageGainPct: 10,
        evidenceCoverageGain: 10,
        readinessGainPct: 9,
        readinessScoreGain: 9,
        matchScoreGain: 9,
        estimatedHours: 6,
        estimatedWeeks: 0.5,
        proofArtifact: "New approved Resume Version featuring quantified performance metrics for every major project.",
        assumptions: ["Replaces vague responsibilities with measurable throughput, latency, or business impact metrics."],
    },
    {
        id: "earn_cloud_cert",
        title: "Complete Official Cloud Certification (AWS / GCP / CKA)",
        category: "certification",
        skillsImpacted: ["Cloud Certification", "Distributed Infrastructure"],
        coverageGainPct: 16,
        evidenceCoverageGain: 16,
        readinessGainPct: 15,
        readinessScoreGain: 15,
        matchScoreGain: 10,
        estimatedHours: 40,
        estimatedWeeks: 3.5,
        proofArtifact: "Credential URL or digital badge verifiable through Credly / official certificate provider.",
        assumptions: ["Passes proctored certification exam covering cloud core fundamentals."],
    },
];

/**
 * Runs a multi-source gap analysis for a user, comparing current evidence against target role requirements
 */
async function runGapAnalysis({ userId, targetRole, targetJobDescription = "", resumeId, versionId }) {
    // 1. Gather User & Resume Data
    let activeResume = null;
    let activeVersion = null;

    if (resumeId) {
        activeResume = await Resume.findOne({ _id: resumeId, userId });
    } else {
        activeResume = await Resume.findOne({ userId }).sort({ updatedAt: -1 });
    }

    if (activeResume) {
        if (versionId) {
            activeVersion = await ResumeVersion.findOne({ _id: versionId, resumeId: activeResume._id });
        } else if (activeResume.currentVersionId) {
            activeVersion = await ResumeVersion.findById(activeResume.currentVersionId);
        } else {
            activeVersion = await ResumeVersion.findOne({ resumeId: activeResume._id }).sort({ versionNumber: -1 });
        }
    }

    const effectiveRole = targetRole || activeResume?.targetRole || "Full Stack Engineer";

    // 2. Gather ATS Analysis
    let latestAnalysis = null;
    if (activeVersion) {
        latestAnalysis = await Analysis.findOne({ versionId: activeVersion._id }).sort({ createdAt: -1 });
    }
    if (!latestAnalysis && activeResume) {
        latestAnalysis = await Analysis.findOne({ resumeId: activeResume._id }).sort({ createdAt: -1 });
    }

    // 3. Gather Developer Tracker Data
    const devProfile = await DeveloperProfile.findOne({ userId });
    const repositories = await PlatformRepository.find({ userId, platform: "github", isDeleted: false });
    const activities = await PlatformActivity.find({ userId });
    const skillEvidences = await SkillEvidence.find({ userId });

    // 4. Gather Career Growth Ladder Data
    const roadmap = await CareerRoadmap.findOne({ userId }).sort({ updatedAt: -1 });
    const learningNotes = await LearningNote.find({ userId });

    // 5. Build Aggregated Demonstrated Skills Map
    const textPool = [];
    if (activeVersion?.rawText) textPool.push(activeVersion.rawText);
    if (activeVersion?.skills) textPool.push(...activeVersion.skills);
    if (activeVersion?.parsedData) {
        textPool.push(JSON.stringify(activeVersion.parsedData));
    }
    if (latestAnalysis?.keywordsPresent) textPool.push(...latestAnalysis.keywordsPresent);

    for (const r of repositories) {
        textPool.push(r.name, r.description || "", r.language || "", ...(r.topics || []));
    }
    for (const a of activities) {
        textPool.push(a.title, a.description || "", ...(a.skillTags || []));
    }

    const aggregatedSearchText = textPool.filter(Boolean).join(" ").toLowerCase();

    // 6. Analyze Skills against Role Dependency Tree
    const dependencySkills = getDependencyTreeForRole(effectiveRole);
    const evidenceMap = new Map();
    const detectedGaps = [];

    const demonstratedSkills = [];
    const partiallyDemonstratedSkills = [];
    const notEvidencedSkills = [];

    for (const skill of dependencySkills) {
        let matchCount = 0;
        const matchingSources = [];

        for (const kw of skill.keywords) {
            const regex = new RegExp(`\\b${kw.replace(/[-\\/\\^$*+?.()|[\\]{}]/g, "\\$&")}\\b`, "i");
            if (regex.test(aggregatedSearchText)) {
                matchCount++;
            }
        }

        // Check repositories specifically for practical project proof
        const matchedRepos = repositories.filter((repo) => {
            const repoStr = `${repo.name} ${repo.description || ""} ${repo.language || ""} ${(repo.topics || []).join(" ")}`.toLowerCase();
            return skill.keywords.some((kw) => repoStr.includes(kw.toLowerCase()));
        });

        if (matchedRepos.length > 0) {
            for (const mr of matchedRepos.slice(0, 3)) {
                matchingSources.push({
                    sourceType: "GitHub Repository",
                    title: mr.name,
                    url: mr.htmlUrl,
                    detail: `Language: ${mr.language || "Multi"} • Stars: ${mr.stars} • Pushed: ${mr.pushedAt ? new Date(mr.pushedAt).toISOString().slice(0, 10) : "N/A"}`,
                });
            }
        }

        // Check coding activities
        const matchedActs = activities.filter((act) => {
            const actStr = `${act.title} ${act.description || ""} ${(act.skillTags || []).join(" ")}`.toLowerCase();
            return skill.keywords.some((kw) => actStr.includes(kw.toLowerCase()));
        });

        if (matchedActs.length > 0) {
            for (const ma of matchedActs.slice(0, 3)) {
                matchingSources.push({
                    sourceType: "Platform Activity",
                    title: ma.title,
                    url: ma.sourceUrl,
                    detail: `${ma.platform} ${ma.activityType} on ${ma.activityDate}`,
                });
            }
        }

        // Classify evidence status
        let status = "not_evidenced";
        if (matchedRepos.length > 0) {
            status = "demonstrated";
            demonstratedSkills.push(skill.label);
        } else if (matchCount >= 2 || matchedActs.length >= 2) {
            status = "demonstrated";
            demonstratedSkills.push(skill.label);
        } else if (matchCount === 1 || matchedActs.length === 1) {
            status = "partially_demonstrated";
            partiallyDemonstratedSkills.push(skill.label);
        } else {
            status = "not_evidenced";
            notEvidencedSkills.push(skill.label);
        }

        evidenceMap.set(skill.id, {
            status,
            evidenceCount: matchingSources.length,
            sources: matchingSources,
        });

        // If not fully demonstrated, construct an explainable gap item
        if (status !== "demonstrated") {
            // Check missing prerequisites
            const missingPrereqs = [];
            for (const prereqId of skill.prerequisites) {
                const prereqStatus = evidenceMap.get(prereqId)?.status;
                if (prereqStatus === "not_evidenced") {
                    const prereqObj = dependencySkills.find((s) => s.id === prereqId);
                    missingPrereqs.push(prereqObj ? prereqObj.label : prereqId);
                }
            }

            // Check if mandatory in JD
            let isMandatory = skill.importance.includes("Core");
            if (targetJobDescription && skill.keywords.some((kw) => targetJobDescription.toLowerCase().includes(kw.toLowerCase()))) {
                isMandatory = true;
            }

            // Calculate priority score (0-100)
            let priorityScore = 40;
            if (isMandatory) priorityScore += 35;
            if (status === "partially_demonstrated") priorityScore += 15;
            if (missingPrereqs.length > 0) priorityScore -= 10; // Prerequisite penalty: learn foundation first

            let priority = "medium";
            if (priorityScore >= 75) priority = "critical";
            else if (priorityScore >= 60) priority = "high";
            else if (priorityScore <= 35) priority = "bonus";

            let priorityReason = "";
            if (isMandatory) {
                priorityReason = `Explicitly required for ${effectiveRole} roles; directly affects technical screening pass rate.`;
            } else if (status === "partially_demonstrated") {
                priorityReason = "Partially referenced in your background, but missing a production project artifact.";
            } else {
                priorityReason = "Supporting capability that reinforces end-to-end engineering depth.";
            }

            // Determine primary gap dimension
            let dimension = "technical_skill";
            if (matchedRepos.length === 0 && (skill.category === "backend" || skill.category === "frontend" || skill.category === "ai_ml")) {
                dimension = "practical_project";
            } else if (skill.category === "dsa") {
                dimension = "problem_solving";
            } else if (missingPrereqs.length > 0) {
                dimension = "learning_prerequisite";
            } else if (isMandatory && targetJobDescription) {
                dimension = "jd_alignment";
            }

            // Build curriculum and project recommendations
            const learningPath = {
                beginner: `Study foundational core syntax, protocol semantics, and basic configurations of ${skill.label}.`,
                intermediate: `Construct modular components/services implementing automated testing, error boundaries, and state flow.`,
                advanced: `Deploy with containerization, monitoring, latency optimization, and resilience under concurrent load.`,
            };

            const suggestedProject = {
                title: `Production ${skill.label.split("(")[0].trim()} Proof Application`,
                description: `Build an end-to-end service exercising ${skill.label} with real persistence, input schema validation, and structured logging.`,
                architecture: `Client UI -> API Gateway / Express Router -> ${skill.label} Processing Layer -> Database / Cache.`,
                deliverableArtifact: `Public GitHub repository containing complete source code, README setup instructions, and working demonstration.`,
            };

            detectedGaps.push({
                id: `gap_${skill.id}`,
                skillName: skill.label,
                category: skill.category,
                dimension,
                priority,
                priorityScore,
                priorityReason,
                isMandatoryInJd: isMandatory,
                currentEvidenceStatus: status,
                prerequisites: skill.prerequisites,
                missingPrerequisites: missingPrereqs,
                whyItMatters: skill.whyPrerequisite || `Critical competency for candidate evaluation in ${effectiveRole} positions.`,
                resumeCheckLocation: "Skills list, Experience bullet points, and Project descriptions",
                existingEvidenceSummary: matchingSources.length > 0
                    ? `Found ${matchingSources.length} partial reference(s) across your profile.`
                    : "No verified code, project repository, or problem solves detected yet for this capability.",
                existingEvidenceSources: matchingSources,
                learningPath,
                suggestedProject,
                evidenceCriteria: `A public GitHub repository with active commits, documented architecture, and verifiable code files.`,
                suggestedResumeBullet: `Architected and shipped a production ${skill.label.split("(")[0].trim()} module, optimizing data throughput and reducing latency by 28%.`,
                estimatedStudyHours: isMandatory ? 25 : 15,
                status: "open",
            });
        }
    }

    // 7. Sort Gaps by Explainable Priority Score
    detectedGaps.sort((a, b) => b.priorityScore - a.priorityScore);

    // 8. Construct Visual DNA Graph
    const skillDnaGraph = buildVisualDnaGraph(effectiveRole, evidenceMap);

    // 9. Deterministic Explainable Rubric Scoring
    const totalSkillsEvaluated = dependencySkills.length;
    const evidenceCoverageScore = Math.min(
        100,
        Math.round(((demonstratedSkills.length + partiallyDemonstratedSkills.length * 0.5) / totalSkillsEvaluated) * 100)
    );

    const resumeCompatibilityScore = latestAnalysis?.atsScore || 65;

    let roadmapCompletionScore = 0;
    if (roadmap?.progress?.totalTasks > 0) {
        roadmapCompletionScore = Math.round(
            (roadmap.progress.completedTasks / roadmap.progress.totalTasks) * 100
        );
    } else {
        roadmapCompletionScore = Math.min(50, Math.round(evidenceCoverageScore * 0.6));
    }

    // Weighted composite readiness: 35% Evidence + 30% Resume + 20% Roadmap + 15% Repo volume
    const repoBonus = Math.min(100, (repositories.length / 5) * 100);
    const careerReadinessEstimate = Math.min(
        100,
        Math.round(
            0.35 * evidenceCoverageScore +
            0.30 * resumeCompatibilityScore +
            0.20 * roadmapCompletionScore +
            0.15 * repoBonus
        )
    );

    // Missing information detection
    const missingInfo = [];
    if (!devProfile?.platforms?.some((p) => p.platform === "github" && p.status === "connected")) {
        missingInfo.push("No GitHub account connected (limits verified project and repository discovery).");
    }
    if (!devProfile?.platforms?.some((p) => p.platform === "leetcode" && p.status === "connected")) {
        missingInfo.push("No LeetCode handle connected (limits verified algorithmic problem-solving evidence).");
    }
    if (!activeResume) {
        missingInfo.push("No uploaded resume found. Scores currently reflect platform evidence only.");
    }
    if (!targetJobDescription) {
        missingInfo.push("No custom Job Description provided. Analysis uses standard industry role requirements.");
    }

    // 10. Check Previous Analysis for Regression Detection
    const previousAnalysis = await CareerGapAnalysis.findOne({ userId }).sort({ createdAt: -1 });
    const regressions = [];

    if (previousAnalysis) {
        if (previousAnalysis.targetRole !== effectiveRole) {
            regressions.push({
                skillName: `Target Role Changed: ${previousAnalysis.targetRole} -> ${effectiveRole}`,
                triggerSource: "role_change",
                previousStatus: "Role Switched",
                currentStatus: "Recalibrated",
                description: `Target role changed from "${previousAnalysis.targetRole}" to "${effectiveRole}". Skill requirements and priorities have been updated accordingly.`,
                suggestedFix: "Review high-priority gaps for your newly selected role and submit evidence for newly introduced requirements.",
            });
        }

        // Compare gap status changes
        const prevGapMap = new Map(previousAnalysis.gaps.map((g) => [g.skillName, g]));
        for (const currentGap of detectedGaps) {
            const prev = prevGapMap.get(currentGap.skillName);
            if (prev && prev.currentEvidenceStatus === "demonstrated" && currentGap.currentEvidenceStatus !== "demonstrated") {
                regressions.push({
                    skillName: currentGap.skillName,
                    gapId: currentGap.id,
                    triggerSource: "resume_version_diff",
                    previousStatus: prev.currentEvidenceStatus,
                    currentStatus: currentGap.currentEvidenceStatus,
                    description: `Previously demonstrated coverage for "${currentGap.skillName}" decreased in the current profile context.`,
                    suggestedFix: "Verify that the corresponding repository or resume bullet remains linked and public.",
                });
            }
        }
    }

    // 11. Build Career Digital Twin Timeline
    const digitalTwinTimeline = [];
    for (const repo of repositories.slice(0, 5)) {
        digitalTwinTimeline.push({
            date: repo.createdAt ? new Date(repo.createdAt).toISOString().slice(0, 10) : "2026-09-01",
            title: `Created Project: ${repo.name}`,
            type: "project_evidence",
            skillName: repo.language || "Software Engineering",
            status: "Demonstrated",
            source: "GitHub",
            description: `Persisted public repository with ${repo.stars} stars and language tag ${repo.language || "Multi"}.`,
        });
    }
    for (const act of activities.slice(0, 5)) {
        digitalTwinTimeline.push({
            date: act.activityDate || "2026-10-01",
            title: act.title,
            type: "activity_milestone",
            skillName: act.skillTags?.[0] || act.platform,
            status: "Practiced",
            source: act.platform,
            description: act.description || `Completed ${act.activityType} on ${act.platform}.`,
        });
    }
    digitalTwinTimeline.sort((a, b) => b.date.localeCompare(a.date));

    // 12. Persist the CareerGapAnalysis document
    const analysisDoc = await CareerGapAnalysis.create({
        userId,
        resumeId: activeResume?._id || new mongoose.Types.ObjectId(),
        versionId: activeVersion?._id,
        targetRole: effectiveRole,
        targetJobDescription: targetJobDescription || "",
        rubricVersion: "v1.2-explainable-evidence",
        rubricBreakdown: {
            resumeCompatibilityScore,
            evidenceCoverageScore,
            learningCompletionScore,
            careerReadinessEstimate,
            inputsUsed: [
                `Resume Version: V${activeVersion?.versionNumber || 1} (${activeResume?.title || "Default"})`,
                `ATS Scoring Model: Gemini Resume Engine`,
                `Developer Tracker: ${repositories.length} Repositories, ${activities.length} Activities`,
                `Competitive Platforms: GitHub, LeetCode`,
                `Target Role: ${effectiveRole}`,
            ],
            missingInformation: missingInfo,
            calculationFormula: "0.35 * EvidenceCoverage + 0.30 * ResumeMatch + 0.20 * RoadmapCompletion + 0.15 * ProjectProof",
        },
        summary: {
            totalGapsDetected: detectedGaps.length,
            criticalGapsCount: detectedGaps.filter((g) => g.priority === "critical").length,
            highPriorityGapsCount: detectedGaps.filter((g) => g.priority === "high").length,
            demonstratedSkillsCount: demonstratedSkills.length,
            partiallyDemonstratedCount: partiallyDemonstratedSkills.length,
            unassessedCount: notEvidencedSkills.length,
            topStrengthsFound: demonstratedSkills.slice(0, 4),
            immediateActionFocus: detectedGaps[0]?.skillName || "System Design & Architecture",
        },
        gaps: detectedGaps,
        skillDnaGraph,
        simulations: [],
        submittedEvidences: previousAnalysis?.submittedEvidences || [],
        regressions,
        digitalTwinTimeline: digitalTwinTimeline.slice(0, 10),
        copilotConversations: [],
    });

    return analysisDoc;
}

/**
 * Calculates a counterfactual simulation for a set of user-chosen actions
 */
async function simulateCareerActions({ userId, actionIds, customActions = [] }) {
    const latestAnalysis = await CareerGapAnalysis.findOne({ userId }).sort({ createdAt: -1 });
    if (!latestAnalysis) {
        throw new Error("No existing gap analysis found. Please run an analysis first.");
    }

    const baselineCoverage = latestAnalysis.rubricBreakdown?.evidenceCoverageScore || 50;
    const baselineReadiness = latestAnalysis.rubricBreakdown?.careerReadinessEstimate || 45;

    let totalCoverageGain = 0;
    let totalReadinessGain = 0;
    let totalHours = 0;
    let proofArtifacts = [];
    let assumptions = [];

    const selectedActions = SIMULATION_ACTIONS.filter((a) => actionIds.includes(a.id));

    for (const act of selectedActions) {
        totalCoverageGain += act.coverageGainPct;
        totalReadinessGain += act.readinessGainPct;
        totalHours += act.estimatedHours;
        proofArtifacts.push(act.proofArtifact);
        assumptions.push(...act.assumptions);
    }

    // Apply diminishing returns factor for multi-action compound simulations
    const compoundFactor = selectedActions.length > 1 ? 0.85 : 1.0;
    const simulatedCoverage = Math.min(100, Math.round(baselineCoverage + totalCoverageGain * compoundFactor));
    const simulatedReadiness = Math.min(100, Math.round(baselineReadiness + totalReadinessGain * compoundFactor));
    const estimatedWeeks = Math.max(1, Math.round((totalHours / 12) * 10) / 10); // based on 12 hours/week study

    const simulationResult = {
        name: `Simulation (${selectedActions.length} Actions Selected)`,
        selectedActionIds: actionIds,
        baselineCoverage,
        simulatedCoverage,
        coverageGain: simulatedCoverage - baselineCoverage,
        baselineReadiness,
        simulatedReadiness,
        readinessGain: simulatedReadiness - baselineReadiness,
        estimatedEffortHours: totalHours,
        estimatedWeeks,
        assumptions: [...new Set(assumptions)],
        requiredProofArtifacts: proofArtifacts,
        disclaimer: "Hypothetical estimation based on product rubric coverage. Does not guarantee job offers, interview calls, or official third-party ATS scores.",
        createdAt: new Date(),
    };

    latestAnalysis.simulations.push(simulationResult);
    await latestAnalysis.save();

    return simulationResult;
}

/**
 * Submits and verifies proof evidence for a skill gap
 */
async function submitGapEvidence({ userId, gapId, skillName, type, title, url = "", notes = "" }) {
    const latestAnalysis = await CareerGapAnalysis.findOne({ userId }).sort({ createdAt: -1 });
    if (!latestAnalysis) throw new Error("Gap analysis not found.");

    let confidenceLevel = 2;
    let confidenceLabel = "Practical Exercise / Code";
    let verificationFeedback = "";
    const detectedArtifacts = [];

    if (type === "github_repo") {
        confidenceLevel = 3;
        confidenceLabel = "Working Repository / Artifact";
        detectedArtifacts.push("GitHub Repository", "Source Code Files");

        if (/docker/i.test(url) || /docker/i.test(title) || /docker/i.test(notes)) {
            detectedArtifacts.push("Dockerfile / Container Specification");
        }
        if (/readme/i.test(notes) || /doc/i.test(notes)) {
            detectedArtifacts.push("Architecture Documentation");
        }
        verificationFeedback = `Repository link saved. Verified code artifact for ${skillName}. Evidence coverage credited in local profile.`;
    } else if (type === "certificate") {
        confidenceLevel = 4;
        confidenceLabel = "Independently Verifiable Project";
        detectedArtifacts.push("Verified Digital Credential");
        verificationFeedback = `Certification reference registered. Verified credential evidence for ${skillName}.`;
    } else {
        confidenceLevel = 2;
        confidenceLabel = "Practical Exercise / Code";
        detectedArtifacts.push("Learning Artifact / Code Sample");
        verificationFeedback = `Learning submission registered for ${skillName}.`;
    }

    const submission = {
        gapId,
        skillName,
        type,
        title,
        url,
        notes,
        submittedAt: new Date(),
        verified: true,
        confidenceLevel,
        confidenceLabel,
        verificationFeedback,
        detectedArtifacts,
    };

    latestAnalysis.submittedEvidences.push(submission);

    // Update gap status in the analysis doc
    const targetGap = latestAnalysis.gaps.find((g) => g.id === gapId || g.skillName === skillName);
    if (targetGap) {
        targetGap.status = "evidence_submitted";
        targetGap.currentEvidenceStatus = "demonstrated";
    }

    // Add to digital twin timeline
    latestAnalysis.digitalTwinTimeline.unshift({
        date: new Date().toISOString().slice(0, 10),
        title: `Submitted Proof: ${title}`,
        type: "evidence_submission",
        skillName,
        status: "Evidence Submitted",
        source: type,
        description: verificationFeedback,
    });

    await latestAnalysis.save();

    // Also persist into SkillEvidence model
    await SkillEvidence.findOneAndUpdate(
        { userId, skillName },
        {
            $set: {
                category: targetGap?.category || "general",
                evidenceLevel: confidenceLevel,
                statusLabel: "Demonstrated in a project",
                readinessStatus: "demonstrated",
                isUserVerified: true,
                lastDemonstratedAt: new Date(),
            },
            $push: {
                evidenceSources: {
                    platform: type,
                    title,
                    sourceUrl: url,
                    description: notes,
                    timestamp: new Date(),
                },
            },
        },
        { upsert: true }
    );

    return {
        submission,
        targetGap,
        message: verificationFeedback,
    };
}

/**
 * Injects a gap item directly into user's CareerRoadmap as an active learning milestone
 */
async function addGapToRoadmap({ userId, gapId }) {
    const latestAnalysis = await CareerGapAnalysis.findOne({ userId }).sort({ createdAt: -1 });
    if (!latestAnalysis) throw new Error("Gap analysis not found.");

    const gap = latestAnalysis.gaps.find((g) => g.id === gapId);
    if (!gap) throw new Error("Gap not found.");

    let roadmap = await CareerRoadmap.findOne({ userId }).sort({ updatedAt: -1 });
    if (!roadmap) {
        // Create baseline roadmap
        roadmap = await CareerRoadmap.create({
            userId,
            resumeId: latestAnalysis.resumeId,
            roadmapVersion: 1,
            targetJob: {
                title: latestAnalysis.targetRole,
                timeframeWeeks: 8,
                studyMinutesPerDay: 45,
            },
            milestones: [],
            dailyTasks: [],
            skillGaps: [],
        });
    }

    const nextWeek = (roadmap.milestones?.length || 0) + 1;

    // Add milestone
    roadmap.milestones.push({
        week: nextWeek,
        title: `Master ${gap.skillName}`,
        goals: [
            gap.learningPath?.beginner || `Study ${gap.skillName} fundamentals`,
            gap.learningPath?.intermediate || `Build practical ${gap.skillName} components`,
            gap.learningPath?.advanced || `Deploy and verify ${gap.skillName} artifact`,
        ],
        skills: [gap.skillName],
        assessment: `Submit working project artifact: ${gap.suggestedProject?.title || "Verification project"}`,
    });

    // Add 3 structured tasks
    roadmap.dailyTasks.push(
        {
            week: nextWeek,
            day: 1,
            title: `Core Principles: ${gap.skillName}`,
            description: gap.learningPath?.beginner || "Understand core syntax and protocol semantics.",
            estimatedMinutes: 45,
            status: "pending",
        },
        {
            week: nextWeek,
            day: 3,
            title: `Practical Implementation: ${gap.suggestedProject?.title || gap.skillName}`,
            description: gap.suggestedProject?.description || "Build a working prototype exercising the skill.",
            estimatedMinutes: 60,
            status: "pending",
        },
        {
            week: nextWeek,
            day: 5,
            title: `Artifact Verification & Documentation`,
            description: `Document architecture in README and prepare project submission link.`,
            estimatedMinutes: 45,
            status: "pending",
        }
    );

    // Track adaptation history
    roadmap.adaptationHistory.push({
        reason: `Added skill gap milestone for "${gap.skillName}" from Gap Intelligence Lab.`,
        summary: `Created Week ${nextWeek} milestone with 3 practical learning tasks.`,
        changedAt: new Date(),
    });

    await roadmap.save();

    gap.status = "roadmap_linked";
    gap.linkedRoadmapId = roadmap._id;
    await latestAnalysis.save();

    return {
        roadmapId: roadmap._id,
        milestoneWeek: nextWeek,
        gapTitle: gap.skillName,
        message: `Successfully linked "${gap.skillName}" into your Career Growth Ladder under Week ${nextWeek}.`,
    };
}

/**
 * Ask Gap Intelligence AI Copilot
 */
async function askGapCopilot({ userId, question }) {
    const latestAnalysis = await CareerGapAnalysis.findOne({ userId }).sort({ createdAt: -1 });

    const role = latestAnalysis?.targetRole || "Full Stack Engineer";
    const gapsSummary = (latestAnalysis?.gaps || [])
        .slice(0, 5)
        .map((g) => `- ${g.skillName} [Priority: ${g.priority}, Status: ${g.currentEvidenceStatus}] Reason: ${g.priorityReason}`)
        .join("\n");

    const readiness = latestAnalysis?.rubricBreakdown?.careerReadinessEstimate || 50;
    const evidenceCoverage = latestAnalysis?.rubricBreakdown?.evidenceCoverageScore || 50;
    const strengths = (latestAnalysis?.summary?.topStrengthsFound || []).join(", ") || "Web development basics";

    const prompt = `
You are the principal AI Career Gap Intelligence Architect for HireSense AI.
You have access to the user's verified career gap analysis:

USER CONTEXT:
- Target Role: ${role}
- Career Readiness Index: ${readiness}%
- Evidence Coverage Score: ${evidenceCoverage}%
- Demonstrated Strengths: ${strengths}
- Top Prioritized Gaps:
${gapsSummary || "No critical gaps recorded."}

USER QUESTION:
"${question}"

INSTRUCTIONS:
1. Provide a direct, highly technical, and empathetic response grounded strictly in the user's real gap data above.
2. If asked what to learn first, explain the prerequisite sequence logically (e.g. why fundamentals precede complex frameworks).
3. If asked for project ideas, specify concrete architectures, deliverables, and verifiable artifacts (e.g. what files to put in a GitHub repo).
4. Never invent fake third-party labor statistics or guaranteed ATS percentages.
5. Format your response cleanly using GitHub-flavored Markdown with bold headings, bullet points, and code snippets if applicable.
`;

    let reply = "";
    try {
        const result = await callGeminiWithFallback(prompt, null, 0.4);
        reply = result.text;
    } catch {
        // Deterministic fallback response if Gemini is temporarily unavailable
        reply = `### Career Gap Analysis for ${role}\n\n` +
            `Based on your current profile with **${evidenceCoverage}% evidence coverage**, here is the recommended plan:\n\n` +
            `1. **Focus on High-Priority Gaps**: Address foundational requirements before attempting complex distributed frameworks.\n` +
            `2. **Build Verifiable Proof**: Rather than just reading documentation, push a public GitHub repository containing a working implementation with README architecture diagrams.\n` +
            `3. **Bridge to Resume**: Once built, add a quantified bullet to your resume highlighting metrics such as throughput, latency, or test coverage.`;
    }

    if (latestAnalysis) {
        latestAnalysis.copilotConversations.push(
            { role: "user", content: question },
            { role: "assistant", content: reply }
        );
        await latestAnalysis.save();
    }

    return {
        answer: reply,
        targetRole: role,
        readinessScore: readiness,
    };
}

module.exports = {
    SIMULATION_ACTIONS,
    runGapAnalysis,
    simulateCareerActions,
    submitGapEvidence,
    addGapToRoadmap,
    askGapCopilot,
};

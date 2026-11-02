/**
 * AI Career Intelligence Service
 * Autonomous, deterministic career analysis and recommendation engine.
 * Synthesizes persistent data across Resumes, ATS Analyses, Developer Platforms,
 * Career Roadmaps, and Live Interview Sessions.
 */

const Resume = require("../models/Resume");
const ResumeVersion = require("../models/ResumeVersion");
const Analysis = require("../models/Analysis");
const DeveloperProfile = require("../models/DeveloperProfile");
const PlatformRepository = require("../models/PlatformRepository");
const PlatformActivity = require("../models/PlatformActivity");
const SkillEvidence = require("../models/SkillEvidence");
const CareerRoadmap = require("../models/CareerRoadmap");
const InterviewSession = require("../models/InterviewSession");
const CareerGapAnalysis = require("../models/CareerGapAnalysis");
const { getDependencyTreeForRole } = require("./skillDependencyDNA");

/**
 * Computes deterministic Career Readiness Overview & Intelligence Insights.
 */
async function getCareerIntelligenceOverview(userId) {
    // 1. Fetch user assets in parallel
    const [
        resumes,
        analyses,
        devProfile,
        repositories,
        activities,
        evidences,
        roadmaps,
        interviews,
        latestGapAnalysis,
    ] = await Promise.all([
        Resume.find({ userId }).sort({ updatedAt: -1 }),
        Analysis.find({ userId }).sort({ createdAt: -1 }),
        DeveloperProfile.findOne({ userId }),
        PlatformRepository.find({ userId, isDeleted: { $ne: true } }).sort({ stars: -1, updatedAt: -1 }),
        PlatformActivity.find({ userId }).sort({ activityDate: -1 }).limit(50),
        SkillEvidence.find({ userId }).sort({ confidenceScore: -1 }),
        CareerRoadmap.find({ userId }).sort({ updatedAt: -1 }),
        InterviewSession.find({ userId }).sort({ createdAt: -1 }),
        CareerGapAnalysis.findOne({ userId }).sort({ createdAt: -1 }),
    ]);

    const activeResume = resumes[0] || null;
    const latestAnalysis = analyses[0] || null;
    const targetRole = activeResume?.targetRole || latestGapAnalysis?.targetRole || devProfile?.targetRole || "Full Stack Engineer";

    // 2. Resume Intelligence Analysis
    const totalResumes = resumes.length;
    const atsScoreHistory = analyses.slice(0, 5).map((a) => ({
        date: a.createdAt ? new Date(a.createdAt).toISOString().slice(0, 10) : "N/A",
        score: a.atsScore || 0,
        resumeId: a.resumeId,
    })).reverse();

    const currentAtsScore = latestAnalysis?.atsScore ?? (activeResume ? 65 : 0);
    const scoreBreakdown = latestAnalysis?.scoreBreakdown || {
        keywords: 15,
        formatting: 18,
        impact: 14,
        clarity: 16,
    };

    const weakResumeSections = (latestAnalysis?.issues || []).map((issue) => ({
        title: issue.title,
        severity: issue.severity,
        explanation: issue.explanation,
        fix: issue.fix,
    }));

    const missingKeywords = latestAnalysis?.keywordsMissing || [];
    const presentKeywords = latestAnalysis?.keywordsPresent || [];

    // 3. Developer Intelligence Analysis
    const connectedPlatforms = (devProfile?.platforms || []).map((p) => ({
        platform: p.platform,
        status: p.status,
        handle: p.handle,
        lastSyncedAt: p.lastSyncedAt,
        repoCount: p.metadata?.publicRepos || 0,
    }));

    const hasConnectedGitHub = connectedPlatforms.some(
        (p) => p.platform === "github" && p.status === "connected"
    );

    const totalRepos = repositories.length;
    const totalActivities = activities.length;
    const verifiedEvidences = evidences.filter((e) => e.verificationStatus === "verified");

    // Calculate commit / activity metrics
    const recentActivityCount = activities.filter((a) => {
        const d = new Date(a.activityDate);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return d >= thirtyDaysAgo;
    }).length;

    // Detect top programming languages in repositories
    const langMap = {};
    for (const repo of repositories) {
        if (repo.language) {
            langMap[repo.language] = (langMap[repo.language] || 0) + 1;
        }
    }
    const topLanguages = Object.entries(langMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    // 4. Skill Intelligence Matrix
    const roleDependencyTree = getDependencyTreeForRole(targetRole);
    const userTextPool = [];
    if (latestAnalysis?.keywordsPresent) userTextPool.push(...latestAnalysis.keywordsPresent);
    for (const r of repositories) {
        userTextPool.push(r.name, r.description || "", r.language || "", ...(r.topics || []));
    }
    for (const a of activities) {
        userTextPool.push(a.title, a.description || "", ...(a.skillTags || []));
    }
    for (const ev of evidences) {
        userTextPool.push(ev.skillName);
    }
    const searchCorpus = userTextPool.filter(Boolean).join(" ").toLowerCase();

    const skillMatrix = roleDependencyTree.map((skill) => {
        const repoMatches = repositories.filter((r) => {
            const str = `${r.name} ${r.description || ""} ${r.language || ""} ${(r.topics || []).join(" ")}`.toLowerCase();
            return skill.keywords.some((kw) => str.includes(kw.toLowerCase()));
        });

        const activityMatches = activities.filter((a) => {
            const str = `${a.title} ${a.description || ""} ${(a.skillTags || []).join(" ")}`.toLowerCase();
            return skill.keywords.some((kw) => str.includes(kw.toLowerCase()));
        });

        const hasKeywordMatch = skill.keywords.some((kw) => {
            const regex = new RegExp(`\\b${kw.replace(/[-\\/\\^$*+?.()|[\\]{}]/g, "\\$&")}\\b`, "i");
            return regex.test(searchCorpus);
        });

        let status = "missing"; // 'verified' | 'emerging' | 'missing'
        let evidenceSummary = "No verifiable evidence found in connected repositories or activities.";

        if (repoMatches.length > 0) {
            status = "verified";
            evidenceSummary = `Verified via repository: ${repoMatches[0].name} (${repoMatches[0].language || "Source code"}).`;
        } else if (activityMatches.length > 0 || hasKeywordMatch) {
            status = "emerging";
            evidenceSummary = activityMatches.length > 0
                ? `Partial evidence via ${activityMatches[0].platform} (${activityMatches[0].title}).`
                : "Mentioned in resume analysis, but lacks verified project artifacts.";
        }

        return {
            id: skill.id,
            name: skill.label,
            category: skill.category,
            status,
            level: skill.level,
            evidenceSummary,
            repoCount: repoMatches.length,
            activityCount: activityMatches.length,
        };
    });

    const verifiedSkills = skillMatrix.filter((s) => s.status === "verified");
    const emergingSkills = skillMatrix.filter((s) => s.status === "emerging");
    const missingSkills = skillMatrix.filter((s) => s.status === "missing");

    // 5. Career Growth Ladder & Milestones
    const activeRoadmap = roadmaps[0] || null;
    const roadmapMilestones = (activeRoadmap?.milestones || []).map((m) => ({
        id: m._id || m.title,
        title: m.title,
        status: m.status, // "completed", "in_progress", "pending"
        skills: m.skillsTargeted || [],
        targetDate: m.targetCompletionDate,
        progressPct: m.status === "completed" ? 100 : m.status === "in_progress" ? 50 : 0,
    }));

    // 6. Interview Readiness Insights
    const completedInterviews = interviews.filter((i) => i.status === "completed");
    const averageInterviewScore = completedInterviews.length > 0
        ? Math.round(
            completedInterviews.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) /
            completedInterviews.length
        )
        : null;

    // 7. Deterministic Career Readiness Scoring (0 to 100)
    // Sub-scores:
    // a) Resume Health (0-100)
    const resumeHealthScore = activeResume ? Math.min(100, Math.max(0, currentAtsScore)) : 0;

    // b) Developer Proof (0-100)
    // Based on GitHub connection (20 pts), Repositories (up to 30 pts), Activities (up to 30 pts), Verified evidences (up to 20 pts)
    let devProofScore = 0;
    if (hasConnectedGitHub) devProofScore += 20;
    devProofScore += Math.min(30, totalRepos * 6);
    devProofScore += Math.min(30, recentActivityCount * 3);
    devProofScore += Math.min(20, verifiedEvidences.length * 5);
    devProofScore = Math.min(100, devProofScore);

    // c) Skill Coverage (0-100)
    const totalRequiredSkills = skillMatrix.length || 1;
    const weightedSkillScore = Math.round(
        ((verifiedSkills.length * 1.0 + emergingSkills.length * 0.5) / totalRequiredSkills) * 100
    );
    const skillCoverageScore = Math.min(100, weightedSkillScore);

    // d) Execution Progress (0-100)
    let executionScore = 30; // base initiation
    if (activeRoadmap) {
        const completedCount = roadmapMilestones.filter((m) => m.status === "completed").length;
        const totalMilestones = roadmapMilestones.length || 1;
        executionScore += Math.round((completedCount / totalMilestones) * 40);
    }
    if (completedInterviews.length > 0) {
        executionScore += Math.min(30, completedInterviews.length * 10);
    }
    executionScore = Math.min(100, executionScore);

    // Composite Weighted Overall Score:
    // Resume (25%) + Dev Proof (30%) + Skill Coverage (25%) + Execution (20%)
    const overallReadinessScore = Math.round(
        resumeHealthScore * 0.25 +
        devProofScore * 0.30 +
        skillCoverageScore * 0.25 +
        executionScore * 0.20
    );

    // 8. Actionable, Evidence-Backed Personalized Recommendations
    const recommendations = [];

    // Recommendation A: High-priority Missing Skill
    if (missingSkills.length > 0) {
        const topMissing = missingSkills[0];
        recommendations.push({
            id: `rec_skill_${topMissing.id}`,
            title: `Build Proof of Work for ${topMissing.name}`,
            category: "developer",
            priority: "high",
            whyGenerated: `Your target role (${targetRole}) requires verified competency in ${topMissing.name}, but 0 repositories or activities demonstrate it.`,
            supportingData: `Assessed against ${targetRole} role dependency graph. Currently 0 verified project anchors for ${topMissing.name}.`,
            actionPlan: `Create or tag a GitHub repository showcasing ${topMissing.name} architecture, or link a verified coding session in Developer Tracker.`,
            targetModule: "Developer Tracker",
            targetUrl: "/developer-tracker",
        });
    }

    // Recommendation B: Resume ATS Optimization
    if (missingKeywords.length > 0) {
        recommendations.push({
            id: "rec_resume_keywords",
            title: `Integrate Missing Industry Keywords: ${missingKeywords.slice(0, 3).join(", ")}`,
            category: "resume",
            priority: currentAtsScore < 75 ? "high" : "medium",
            whyGenerated: `Your latest ATS score is ${currentAtsScore}/100. Adding high-signal keywords found in matching job descriptions directly lifts employer search visibility.`,
            supportingData: `${missingKeywords.length} critical keywords missing from active resume (${activeResume?.title || "Default Resume"}).`,
            actionPlan: `Use the Resume Editor & Keyword Intelligence to integrate terms into experience bullets with quantified impact.`,
            targetModule: "Resumes",
            targetUrl: activeResume ? `/resumes/${activeResume._id}` : "/resumes",
        });
    }

    // Recommendation C: GitHub Platform Connection
    if (!hasConnectedGitHub) {
        recommendations.push({
            id: "rec_connect_github",
            title: "Connect GitHub Account to Unlock Autonomous Evidence Tracking",
            category: "developer",
            priority: "high",
            whyGenerated: "Developer Intelligence cannot verify your coding consistency, pull requests, or repository codebases without a connected account.",
            supportingData: "0 external developer platforms currently connected to profile.",
            actionPlan: "Navigate to Developer Tracker and enter your GitHub username to automatically index public repositories and commits.",
            targetModule: "Developer Tracker",
            targetUrl: "/developer-tracker",
        });
    } else if (repositories.length > 0 && verifiedSkills.length < 3) {
        recommendations.push({
            id: "rec_deepen_evidence",
            title: "Attach Code Evidence to Unverified Skills",
            category: "developer",
            priority: "medium",
            whyGenerated: "Several skills are present in resume text but lack direct repository commit proof.",
            supportingData: `${emergingSkills.length} skills in 'emerging' status needing source repository confirmation.`,
            actionPlan: "Ensure your repositories have descriptive READMEs and package files referencing your technology stack.",
            targetModule: "Developer Tracker",
            targetUrl: "/developer-tracker",
        });
    }

    // Recommendation D: Interview Simulation
    if (completedInterviews.length === 0) {
        recommendations.push({
            id: "rec_practice_interview",
            title: `Complete Live Voice Interview for ${targetRole}`,
            category: "interview",
            priority: "medium",
            whyGenerated: "You have not completed an adaptive live interview simulation to validate technical articulation under realistic conditions.",
            supportingData: "0 live interview sessions recorded.",
            actionPlan: "Start a 30-minute adaptive technical round with the AI Interviewer grounded in your resume projects.",
            targetModule: "Live Interview Studio",
            targetUrl: "/interview",
        });
    }

    // Recommendation E: Roadmap Milestone
    if (activeRoadmap) {
        const pendingMilestone = roadmapMilestones.find((m) => m.status === "in_progress" || m.status === "pending");
        if (pendingMilestone) {
            recommendations.push({
                id: `rec_roadmap_${pendingMilestone.id}`,
                title: `Advance Milestone: ${pendingMilestone.title}`,
                category: "roadmap",
                priority: "medium",
                whyGenerated: `Targeted milestone toward career progression as ${targetRole}.`,
                supportingData: `Target completion date: ${pendingMilestone.targetDate ? new Date(pendingMilestone.targetDate).toLocaleDateString() : "Flexible"}.`,
                actionPlan: "Review checklist items and log completion notes in Career Growth Ladder.",
                targetModule: "Career Roadmap",
                targetUrl: activeResume ? `/resumes/${activeResume._id}/roadmap` : "/resumes",
            });
        }
    }

    return {
        targetRole,
        activeResume: activeResume
            ? {
                id: activeResume._id,
                title: activeResume.title,
                targetRole: activeResume.targetRole,
                updatedAt: activeResume.updatedAt,
            }
            : null,
        readiness: {
            overallScore: overallReadinessScore,
            statusLabel:
                overallReadinessScore >= 80
                    ? "Job Ready"
                    : overallReadinessScore >= 60
                        ? "Competitive"
                        : overallReadinessScore >= 40
                            ? "Developing"
                            : "Foundational",
            breakdown: {
                resumeHealth: resumeHealthScore,
                developerProof: devProofScore,
                skillCoverage: skillCoverageScore,
                executionProgress: executionScore,
            },
        },
        skillIntelligence: {
            totalSkills: skillMatrix.length,
            verifiedCount: verifiedSkills.length,
            emergingCount: emergingSkills.length,
            missingCount: missingSkills.length,
            matrix: skillMatrix,
            verifiedSkills: verifiedSkills.map((s) => s.name),
            emergingSkills: emergingSkills.map((s) => s.name),
            missingSkills: missingSkills.map((s) => s.name),
        },
        resumeHealth: {
            atsScore: currentAtsScore,
            scoreBreakdown,
            scoreHistory: atsScoreHistory,
            weakSections: weakResumeSections,
            missingKeywords,
            presentKeywordsCount: presentKeywords.length,
            totalVersions: totalResumes,
        },
        developerIntelligence: {
            hasConnectedGitHub,
            connectedPlatforms,
            totalRepos,
            recentActivityCount,
            totalEvidences: evidences.length,
            topLanguages,
            repositories: repositories.slice(0, 6).map((r) => ({
                id: r._id,
                name: r.name,
                language: r.language,
                stars: r.stars,
                url: r.htmlUrl,
            })),
        },
        careerGrowth: {
            roadmapId: activeRoadmap?._id || null,
            milestones: roadmapMilestones,
            completedMilestonesCount: roadmapMilestones.filter((m) => m.status === "completed").length,
            totalMilestonesCount: roadmapMilestones.length,
            interviewsCompletedCount: completedInterviews.length,
            averageInterviewScore,
        },
        recommendations,
        generatedAt: new Date().toISOString(),
    };
}

module.exports = {
    getCareerIntelligenceOverview,
};


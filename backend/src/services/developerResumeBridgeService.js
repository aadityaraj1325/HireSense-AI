/**
 * Developer Resume Bridge Service
 * Identifies verified developer activity (GitHub projects, problem-solving milestones)
 * and formulates ATS-optimized, truthful resume bullets for user review and approval.
 * When approved, safely creates a new resume version preserving full history!
 */

const DeveloperProfile = require("../models/DeveloperProfile");
const PlatformActivity = require("../models/PlatformActivity");
const Resume = require("../models/Resume");
const ResumeVersion = require("../models/ResumeVersion");
const ApiError = require("../utils/ApiError");

/**
 * Scan activities and generate pending resume bullet suggestions
 */
async function getResumeBridgeSuggestions(userId) {
    const profile = await DeveloperProfile.findOne({ userId });
    const activities = await PlatformActivity.find({ userId }).sort({ timestamp: -1 });

    const suggestions = [];

    // 1. Check for GitHub repositories
    const repoActivities = activities.filter(
        (a) => a.platform === "github" && (a.activityType === "repo_created" || a.activityType === "commit")
    );
    const reposByName = new Map();
    for (const act of repoActivities) {
        const repo = act.metadata?.repoName;
        if (repo && !reposByName.has(repo)) {
            reposByName.set(repo, act);
        }
    }

    let idCounter = 1;
    for (const [repoName, act] of reposByName.entries()) {
        const cleanRepoName = repoName.split("/")[1] || repoName;
        suggestions.push({
            id: `sug_repo_${idCounter++}`,
            type: "project",
            sourcePlatform: "github",
            sourceTitle: cleanRepoName,
            sourceUrl: act.sourceUrl,
            confidence: "high",
            suggestedSection: "projects",
            suggestedProjectName: cleanRepoName.replace(/[-_]/g, " "),
            suggestedBullet: `Architected and maintained ${cleanRepoName.replace(/[-_]/g, " ")}, implementing modular engineering workflows with version control and clean commit practices.`,
            reason: `Connected GitHub repository "${cleanRepoName}" provides verifiable proof of software development and version control practices.`,
            status: "pending",
        });
    }

    // 2. Check for Competitive Programming / LeetCode milestones
    const solvedCount = profile?.statsSummary?.totalProblemsSolved || 0;
    if (solvedCount >= 25) {
        suggestions.push({
            id: `sug_dsa_${idCounter++}`,
            type: "achievement",
            sourcePlatform: "leetcode",
            sourceTitle: `${solvedCount} Problems Solved`,
            sourceUrl: profile?.platforms?.find((p) => p.platform === "leetcode")?.profileUrl || "",
            confidence: "verified",
            suggestedSection: "summary",
            suggestedBullet: `Solved ${solvedCount}+ data structures and algorithms problems across competitive platforms, developing deep proficiency in time and space complexity optimization.`,
            reason: `Demonstrated algorithmic problem solving with ${solvedCount} verified problem completions.`,
            status: "pending",
        });
    }

    // 3. Check for Codeforces rating milestone
    const cfRating = profile?.statsSummary?.currentRating;
    if (cfRating && cfRating > 1200) {
        suggestions.push({
            id: `sug_cf_${idCounter++}`,
            type: "achievement",
            sourcePlatform: "codeforces",
            sourceTitle: `Codeforces Rating ${cfRating}`,
            sourceUrl: `https://codeforces.com/profile/${profile?.platforms?.find((p) => p.platform === "codeforces")?.handle || ""}`,
            confidence: "verified",
            suggestedSection: "skills",
            suggestedBullet: `Achieved competitive rating of ${cfRating} on Codeforces through consistent participation in timed algorithmic contests.`,
            reason: `Verifiable contest performance and problem solving under timed constraints.`,
            status: "pending",
        });
    }

    return suggestions;
}

/**
 * Apply an approved suggestion to an existing Resume, generating a brand new ResumeVersion!
 */
async function applyResumeBridgeSuggestion(userId, { resumeId, suggestionId, customBullet, section = "projects", projectName = "" }) {
    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) {
        throw ApiError.notFound("Resume not found or does not belong to you.");
    }

    const currentVersion = await ResumeVersion.findById(resume.currentVersionId);
    if (!currentVersion) {
        throw ApiError.notFound("Current resume version could not be loaded.");
    }

    const nextVersionNumber = (resume.latestVersionNumber || 1) + 1;
    const newLabel = `V${nextVersionNumber} (Dev Tracker)`;

    // Clone current parsedSections
    const newParsedSections = JSON.parse(JSON.stringify(currentVersion.parsedSections || {}));

    const bulletToAdd = customBullet.trim();

    if (section === "projects") {
        if (!Array.isArray(newParsedSections.projects)) {
            newParsedSections.projects = [];
        }
        const nameToUse = projectName || "Featured Project";
        const existingProj = newParsedSections.projects.find(
            (p) => p.name && p.name.toLowerCase() === nameToUse.toLowerCase()
        );

        if (existingProj) {
            existingProj.description = existingProj.description
                ? `${existingProj.description} ${bulletToAdd}`
                : bulletToAdd;
        } else {
            newParsedSections.projects.push({
                name: nameToUse,
                description: bulletToAdd,
                tech: ["Git", "GitHub"],
                links: [],
            });
        }
    } else if (section === "summary") {
        newParsedSections.summary = newParsedSections.summary
            ? `${newParsedSections.summary}\n${bulletToAdd}`
            : bulletToAdd;
    } else if (section === "skills") {
        if (!Array.isArray(newParsedSections.skills)) {
            newParsedSections.skills = [];
        }
        newParsedSections.skills.push(bulletToAdd);
    }

    // Append to rawText
    const updatedRawText = `${currentVersion.rawText || ""}\n\n[Developer Tracker Added]:\n${bulletToAdd}`;

    // Create the immutable new ResumeVersion
    const newVersion = await ResumeVersion.create({
        resumeId: resume._id,
        versionNumber: nextVersionNumber,
        label: newLabel,
        rawText: updatedRawText,
        parsedSections: newParsedSections,
        sourceType: "rewrite",
        parentVersionId: currentVersion._id,
        targetRole: resume.targetRole || "Software Engineer",
        changeSummary: `Integrated verified developer proof-of-work: "${bulletToAdd.slice(0, 60)}..."`,
    });

    // Update parent Resume pointer
    resume.currentVersionId = newVersion._id;
    resume.latestVersionNumber = nextVersionNumber;
    await resume.save();

    return {
        success: true,
        resumeId: resume._id,
        newVersionId: newVersion._id,
        versionNumber: nextVersionNumber,
        label: newLabel,
        addedBullet: bulletToAdd,
    };
}

module.exports = {
    getResumeBridgeSuggestions,
    applyResumeBridgeSuggestion,
};


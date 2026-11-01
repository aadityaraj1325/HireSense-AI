/**
 * Proof-of-Work Career Intelligence Service
 * Maps developer activities to demonstrable skills and computes target job readiness.
 * Labels: Practiced, Demonstrated in a project, Repeatedly demonstrated, Verified by supported evidence.
 */

const PlatformActivity = require("../models/PlatformActivity");
const SkillEvidence = require("../models/SkillEvidence");

// Canonical skill requirement matrices for major target developer roles
const ROLE_REQUIREMENT_MATRICES = {
    "AI Engineer": [
        { skill: "Python", category: "ai_ml", priority: "Core Requirement", keywords: ["python", "py"] },
        { skill: "Data Structures & Algorithms", category: "dsa", priority: "Core Requirement", keywords: ["algorithms", "dsa", "dynamic programming", "graphs", "trees", "math"] },
        { skill: "Machine Learning & Deep Learning", category: "ai_ml", priority: "Core Requirement", keywords: ["machine learning", "deep learning", "pytorch", "tensorflow", "scikit-learn", "keras", "kaggle"] },
        { skill: "API Development", category: "backend", priority: "Important", keywords: ["api", "rest", "fastapi", "flask", "express", "graphql"] },
        { skill: "Git & Version Control", category: "devops", priority: "Important", keywords: ["git", "github", "commit", "pull request"] },
        { skill: "Backend Engineering", category: "backend", priority: "Important", keywords: ["backend", "node.js", "django", "server"] },
        { skill: "Cloud & Deployment", category: "devops", priority: "Supporting", keywords: ["docker", "aws", "gcp", "azure", "deployment", "kubernetes"] },
        { skill: "AI Agent Development", category: "ai_ml", priority: "Bonus", keywords: ["llm", "langchain", "gemini", "openai", "agent", "rag"] },
    ],
    "Full Stack Engineer": [
        { skill: "JavaScript & TypeScript", category: "frontend", priority: "Core Requirement", keywords: ["javascript", "typescript", "js", "ts"] },
        { skill: "Frontend Frameworks (React/Vue/Next)", category: "frontend", priority: "Core Requirement", keywords: ["react", "vue", "next.js", "frontend", "tailwind", "html", "css"] },
        { skill: "Backend Development (Node/Express/Python)", category: "backend", priority: "Core Requirement", keywords: ["node", "express", "backend", "python", "django", "fastapi"] },
        { skill: "Databases (SQL & NoSQL)", category: "database", priority: "Core Requirement", keywords: ["mongodb", "sql", "postgresql", "mysql", "database", "redis", "prisma", "mongoose"] },
        { skill: "REST & GraphQL APIs", category: "backend", priority: "Important", keywords: ["api", "rest", "restful", "graphql", "endpoints"] },
        { skill: "Data Structures & Problem Solving", category: "dsa", priority: "Important", keywords: ["algorithms", "dsa", "leetcode", "codeforces", "competitive programming"] },
        { skill: "Git & GitHub Collaboration", category: "devops", priority: "Important", keywords: ["git", "github", "commit", "pull request", "code review"] },
        { skill: "Testing & DevOps Basics", category: "devops", priority: "Supporting", keywords: ["docker", "jest", "ci/cd", "github actions", "unit test", "devops"] },
    ],
    "Software Engineer": [
        { skill: "Data Structures & Algorithms", category: "dsa", priority: "Core Requirement", keywords: ["algorithms", "dsa", "leetcode", "codeforces", "dynamic programming", "graphs", "trees", "sorting", "binary search"] },
        { skill: "Core Programming (Java/C++/Python/Go)", category: "backend", priority: "Core Requirement", keywords: ["c++", "cpp", "java", "python", "go", "golang", "c#", "rust"] },
        { skill: "Object-Oriented & System Design", category: "system_design", priority: "Important", keywords: ["oop", "system design", "architecture", "design patterns"] },
        { skill: "Git & Source Control", category: "devops", priority: "Important", keywords: ["git", "github", "commit", "branch"] },
        { skill: "Database Management", category: "database", priority: "Important", keywords: ["sql", "database", "nosql", "query"] },
        { skill: "Testing & Debugging", category: "general", priority: "Supporting", keywords: ["test", "unit test", "debugging", "profiling"] },
    ],
    "Frontend Engineer": [
        { skill: "JavaScript & TypeScript Deep Dive", category: "frontend", priority: "Core Requirement", keywords: ["javascript", "typescript", "es6"] },
        { skill: "Modern React & Component Design", category: "frontend", priority: "Core Requirement", keywords: ["react", "react.js", "hooks", "jsx", "tsx", "next.js"] },
        { skill: "CSS Architecture & UI Systems", category: "frontend", priority: "Core Requirement", keywords: ["css", "tailwind", "sass", "styling", "responsive", "ui"] },
        { skill: "Web Performance & Accessibility", category: "frontend", priority: "Important", keywords: ["performance", "a11y", "lighthouse", "seo"] },
        { skill: "State Management & API Integration", category: "frontend", priority: "Important", keywords: ["redux", "tanstack", "query", "axios", "rest", "api"] },
        { skill: "Git & CI/CD for Frontend", category: "devops", priority: "Supporting", keywords: ["git", "github", "vite", "webpack", "deployment"] },
    ],
};

function getRoleRequirements(targetRole) {
    if (ROLE_REQUIREMENT_MATRICES[targetRole]) {
        return ROLE_REQUIREMENT_MATRICES[targetRole];
    }
    // Default fallback to Software Engineer matrix
    return ROLE_REQUIREMENT_MATRICES["Software Engineer"];
}

/**
 * Re-computes and syncs SkillEvidence for a user based on their PlatformActivities
 */
async function syncSkillEvidenceForUser(userId, targetRole = "Full Stack Engineer") {
    const activities = await PlatformActivity.find({ userId }).sort({ timestamp: -1 });

    const requirements = getRoleRequirements(targetRole);
    const existingEvidenceList = await SkillEvidence.find({ userId });
    const existingBySkill = new Map(existingEvidenceList.map((e) => [e.skillName, e]));

    const computedResults = [];

    for (const req of requirements) {
        // Find matching activities for this skill
        const matchingActivities = [];

        for (const act of activities) {
            const textToSearch = [
                act.title,
                act.description,
                ...(act.skillTags || []),
                act.metadata?.repoName,
                act.metadata?.language,
                act.metadata?.programmingLanguage,
                ...(act.metadata?.tags || []),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const isMatch = req.keywords.some((kw) => textToSearch.includes(kw.toLowerCase()));
            if (isMatch) {
                matchingActivities.push(act);
            }
        }

        const count = matchingActivities.length;
        const projectActivities = matchingActivities.filter(
            (a) => a.activityType === "repo_created" || (a.activityType === "commit" && a.metadata?.repoName)
        );
        const contestOrVerifiedActivities = matchingActivities.filter(
            (a) => a.activityType === "contest" || a.verificationLevel >= 4
        );

        let evidenceLevel = 1;
        let statusLabel = "Practiced";
        let readinessStatus = "not_demonstrated";

        if (count === 0) {
            readinessStatus = "not_demonstrated";
            evidenceLevel = 1;
            statusLabel = "Practiced";
        } else if (contestOrVerifiedActivities.length > 0) {
            evidenceLevel = 4;
            statusLabel = "Verified by supported evidence";
            readinessStatus = "demonstrated";
        } else if (projectActivities.length > 0) {
            evidenceLevel = 3;
            statusLabel = "Demonstrated in a project";
            readinessStatus = "demonstrated";
        } else if (count >= 3) {
            evidenceLevel = 2;
            statusLabel = "Repeatedly demonstrated";
            readinessStatus = "demonstrated";
        } else {
            evidenceLevel = 1;
            statusLabel = "Practiced";
            readinessStatus = "partial_evidence";
        }

        // Check if user has DSA practice but needs practical projects
        if (req.category === "backend" || req.category === "frontend" || req.category === "ai_ml") {
            if (count > 0 && projectActivities.length === 0) {
                readinessStatus = "needs_practical_evidence";
            }
        }

        const evidenceSources = matchingActivities.slice(0, 5).map((act) => ({
            platform: act.platform,
            activityId: act._id,
            title: act.title,
            sourceUrl: act.sourceUrl,
            timestamp: act.timestamp,
            description: act.description,
            metricValue: act.metadata?.difficulty || act.metadata?.rating || "",
        }));

        const existing = existingBySkill.get(req.skill);
        const isUserVerified = existing?.isUserVerified || false;

        const updateData = {
            userId,
            skillName: req.skill,
            category: req.category,
            evidenceLevel,
            statusLabel,
            targetRoleRelevance: req.priority,
            readinessStatus,
            evidenceSources,
            occurrenceCount: count,
            lastDemonstratedAt: matchingActivities[0]?.timestamp || new Date(),
            isUserVerified,
        };

        const doc = await SkillEvidence.findOneAndUpdate(
            { userId, skillName: req.skill },
            { $set: updateData },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        computedResults.push(doc);
    }

    return computedResults;
}

/**
 * Calculates Target Job Readiness statistics
 */
async function getTargetJobReadiness(userId, targetRole = "Full Stack Engineer") {
    const evidenceItems = await syncSkillEvidenceForUser(userId, targetRole);

    const demonstrated = evidenceItems.filter((e) => e.readinessStatus === "demonstrated");
    const partial = evidenceItems.filter((e) => e.readinessStatus === "partial_evidence");
    const needsProject = evidenceItems.filter((e) => e.readinessStatus === "needs_practical_evidence");
    const missing = evidenceItems.filter((e) => e.readinessStatus === "not_demonstrated");

    const total = evidenceItems.length || 1;
    // Score computation: demonstrated = 100%, partial = 50%, needsProject = 60%, missing = 0%
    const weightedPoints =
        demonstrated.length * 100 +
        partial.length * 50 +
        needsProject.length * 60;
    const readinessPercentage = Math.min(100, Math.round(weightedPoints / total));

    return {
        targetRole,
        readinessPercentage,
        counts: {
            total: evidenceItems.length,
            demonstrated: demonstrated.length,
            partial: partial.length,
            needsPracticalEvidence: needsProject.length,
            notDemonstrated: missing.length,
        },
        skills: {
            demonstrated,
            partial,
            needsPracticalEvidence: needsProject,
            notDemonstrated: missing,
        },
    };
}

module.exports = {
    ROLE_REQUIREMENT_MATRICES,
    getRoleRequirements,
    syncSkillEvidenceForUser,
    getTargetJobReadiness,
};


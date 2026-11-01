const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const { z } = require("zod");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const DeveloperProfile = require("../models/DeveloperProfile");
const PlatformActivity = require("../models/PlatformActivity");
const PlatformRepository = require("../models/PlatformRepository");
const PlatformSyncLog = require("../models/PlatformSyncLog");
const CodingSession = require("../models/CodingSession");
const SkillEvidence = require("../models/SkillEvidence");

const githubService = require("../services/githubIntegrationService");
const codeforcesService = require("../services/codeforcesIntegrationService");
const leetcodeService = require("../services/leetcodeIntegrationService");
const { sanitizePlatformAndHandle, generateProfileUrl } = require("../utils/platformUrlParser");

const { syncPlatform, syncAllPlatforms, recalculateProfileSummary } = require("../services/platformSyncService");
const { getTargetJobReadiness, syncSkillEvidenceForUser } = require("../services/skillEvidenceService");
const { askDeveloperCoach } = require("../services/developerCoachService");
const { getResumeBridgeSuggestions, applyResumeBridgeSuggestion } = require("../services/developerResumeBridgeService");

const router = express.Router();

/**
 * POST /webhooks/github
 * Real-time GitHub Webhook endpoint for repository creation, pushes, and updates.
 * Unauthenticated by cookie; verified by HMAC SHA-256 signature when secret is configured.
 */
router.post(
    "/webhooks/github",
    asyncHandler(async (req, res) => {
        const signature = req.headers["x-hub-signature-256"];
        const eventName = req.headers["x-github-event"];
        const deliveryId = req.headers["x-github-delivery"];

        const secret = process.env.GITHUB_WEBHOOK_SECRET;
        if (secret && signature) {
            const hmac = crypto.createHmac("sha256", secret);
            const digest = "sha256=" + hmac.update(JSON.stringify(req.body)).digest("hex");
            if (signature !== digest) {
                return res.status(401).json({ error: "Invalid webhook signature" });
            }
        }

        const payload = req.body || {};
        const senderLogin = payload.sender?.login || payload.repository?.owner?.login;

        if (!senderLogin) {
            return res.json({ received: true, message: "No sender or repository owner in payload" });
        }

        // Find user by linked GitHub handle
        const profile = await DeveloperProfile.findOne({
            "platforms.platform": "github",
            "platforms.handle": { $regex: new RegExp(`^${senderLogin}$`, "i") },
        });

        if (!profile) {
            return res.json({ received: true, message: `No linked account found for handle ${senderLogin}` });
        }

        const userId = profile.userId;

        if (eventName === "repository") {
            const repo = payload.repository;
            const action = payload.action;

            if (action === "created" || action === "publicized" || action === "unarchived") {
                await PlatformRepository.findOneAndUpdate(
                    { userId, platform: "github", githubRepoId: repo.id },
                    {
                        name: repo.name,
                        fullName: repo.full_name,
                        ownerLogin: repo.owner?.login || senderLogin,
                        description: repo.description || "",
                        htmlUrl: repo.html_url,
                        visibility: repo.visibility || (repo.private ? "private" : "public"),
                        defaultBranch: repo.default_branch || "main",
                        language: repo.language || null,
                        topics: repo.topics || [],
                        stars: repo.stargazers_count || 0,
                        forks: repo.forks_count || 0,
                        openIssuesCount: repo.open_issues_count || 0,
                        isFork: Boolean(repo.fork),
                        isArchived: Boolean(repo.archived),
                        isDeleted: false,
                        createdAt: new Date(repo.created_at),
                        updatedAt: new Date(repo.updated_at),
                        pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
                        lastSyncedAt: new Date(),
                    },
                    { upsert: true }
                );

                const repoCreatedAct = githubService.normalizeRepoCreatedActivity(repo, userId);
                await PlatformActivity.findOneAndUpdate(
                    { userId, platform: "github", externalId: repoCreatedAct.externalId },
                    { $set: repoCreatedAct },
                    { upsert: true }
                );
            } else if (action === "deleted") {
                await PlatformRepository.findOneAndUpdate(
                    { userId, platform: "github", githubRepoId: repo.id },
                    { $set: { isDeleted: true, lastSyncedAt: new Date() } }
                );
            }
        } else if (eventName === "push") {
            const repo = payload.repository;
            const commits = payload.commits || [];
            if (commits.length > 0) {
                const commitActivities = githubService.normalizeRepoCommits(
                    commits.map((c) => ({
                        sha: c.id,
                        message: c.message ? c.message.split("\n")[0] : `Push to ${repo?.name}`,
                        fullMessage: c.message,
                        date: c.timestamp,
                        htmlUrl: c.url,
                        authorLogin: c.author?.username || senderLogin,
                    })),
                    repo?.name || "repo",
                    repo?.owner?.login || senderLogin,
                    userId
                );

                for (const act of commitActivities) {
                    await PlatformActivity.findOneAndUpdate(
                        { userId, platform: "github", externalId: act.externalId },
                        { $set: act },
                        { upsert: true }
                    );
                }
            }

            if (repo?.id) {
                await PlatformRepository.findOneAndUpdate(
                    { userId, platform: "github", githubRepoId: repo.id },
                    { $set: { pushedAt: new Date(), lastSyncedAt: new Date() } }
                );
            }
        }

        await recalculateProfileSummary(profile);
        await profile.save();
        await syncSkillEvidenceForUser(userId, profile.targetRole);

        res.json({ ok: true, event: eventName, action: payload.action, deliveryId });
    })
);

// Require user authentication for all subsequent tracker endpoints
router.use(requireAuth);

// Helper: Ensure profile exists
async function getOrCreateProfile(userId) {
    let profile = await DeveloperProfile.findOne({ userId });
    if (!profile) {
        profile = await DeveloperProfile.create({
            userId,
            targetRole: "Full Stack Engineer",
            platforms: [],
        });
    }
    return profile;
}

// Validation schemas
const connectSchema = z.object({
    platform: z.enum([
        "github",
        "leetcode",
        "codeforces",
        "hackerrank",
        "codechef",
        "geeksforgeeks",
        "atcoder",
        "kaggle",
        "other",
    ]),
    handle: z.string().min(1).max(500).trim(), // supports full profile links
    connectionType: z
        .enum(["oauth", "api", "public_profile", "imported_data", "manually_entered"])
        .optional(),
    token: z.string().max(255).optional(),
});

const verifyLinkSchema = z.object({
    platform: z
        .enum([
            "github",
            "leetcode",
            "codeforces",
            "hackerrank",
            "codechef",
            "geeksforgeeks",
            "atcoder",
            "kaggle",
            "other",
        ])
        .optional(),
    linkOrHandle: z.string().min(1).max(500).trim(),
    token: z.string().max(255).optional(),
});

const profileUpdateSchema = z.object({
    targetRole: z.string().min(2).max(120).optional(),
    bio: z.string().max(500).optional(),
    weeklyFocusGoalMinutes: z.number().min(0).max(5000).optional(),
    dailyProblemGoal: z.number().min(0).max(50).optional(),
});

const manualActivitySchema = z.object({
    platform: z.enum([
        "github",
        "leetcode",
        "codeforces",
        "hackerrank",
        "codechef",
        "geeksforgeeks",
        "atcoder",
        "kaggle",
        "manual",
        "focus_timer",
        "other",
    ]),
    activityType: z.enum([
        "commit",
        "pull_request",
        "repo_created",
        "problem_solved",
        "contest",
        "focus_session",
        "learning_task",
        "certification",
        "manual_activity",
    ]),
    title: z.string().min(3).max(300).trim(),
    description: z.string().max(2000).optional(),
    sourceUrl: z
        .string()
        .max(500)
        .optional()
        .transform((val) => {
            if (!val || !val.trim()) return "";
            const trimmed = val.trim();
            if (!/^https?:\/\//i.test(trimmed)) {
                return `https://${trimmed}`;
            }
            return trimmed;
        })
        .refine((val) => {
            if (!val) return true;
            try {
                new URL(val);
                return true;
            } catch {
                return false;
            }
        }, "Please enter a valid URL (e.g. https://github.com/...)"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
    skillTags: z.array(z.string().trim()).optional(),
    durationMinutes: z.number().min(0).max(1440).optional(),
});

const focusSessionSchema = z.object({
    topic: z.string().min(2).max(200).trim(),
    durationMinutes: z.number().min(1).max(1440),
    startTime: z.string().datetime().or(z.string()),
    endTime: z.string().datetime().or(z.string()),
    sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    problemsAttempted: z.number().min(0).optional(),
    projectWork: z.string().max(300).optional(),
    learningObjective: z.string().max(500).optional(),
    reflection: z.string().max(2000).optional(),
    skillsPracticed: z.array(z.string().trim()).optional(),
});

const applyBridgeSchema = z.object({
    resumeId: z.string().refine(mongoose.isValidObjectId, "Invalid resumeId"),
    suggestionId: z.string().optional(),
    customBullet: z.string().min(5).max(1000).trim(),
    section: z.enum(["projects", "summary", "skills"]).optional(),
    projectName: z.string().max(100).optional(),
});

const coachChatSchema = z.object({
    question: z.string().min(3).max(1000).trim(),
});

/**
 * GET /profile
 * Returns profile with connected accounts and summary stats
 */
router.get(
    "/profile",
    asyncHandler(async (req, res) => {
        const profile = await getOrCreateProfile(req.user._id);
        res.json({ profile });
    })
);

/**
 * PATCH /profile
 * Updates target role and goals
 */
router.patch(
    "/profile",
    validate(profileUpdateSchema),
    asyncHandler(async (req, res) => {
        const profile = await getOrCreateProfile(req.user._id);
        const { targetRole, bio, weeklyFocusGoalMinutes, dailyProblemGoal } = req.body;

        if (targetRole !== undefined) profile.targetRole = targetRole;
        if (bio !== undefined) profile.bio = bio;
        if (weeklyFocusGoalMinutes !== undefined) profile.weeklyFocusGoalMinutes = weeklyFocusGoalMinutes;
        if (dailyProblemGoal !== undefined) profile.dailyProblemGoal = dailyProblemGoal;

        await profile.save();

        if (targetRole) {
            // Re-sync proof-of-work readiness for new role
            await syncSkillEvidenceForUser(req.user._id, targetRole);
        }

        res.json({ profile });
    })
);

/**
 * POST /verify-link
 * Verifies a profile link or handle before connecting, returns preview details
 */
router.post(
    "/verify-link",
    validate(verifyLinkSchema),
    asyncHandler(async (req, res) => {
        const { platform: requestedPlatform, linkOrHandle, token } = req.body;
        const { platform, handle, wasEmail } = sanitizePlatformAndHandle(requestedPlatform || "github", linkOrHandle);
        const profileUrl = generateProfileUrl(platform, handle);

        if (!handle) {
            throw ApiError.badRequest(
                `Please enter a valid ${requestedPlatform || "platform"} username or full profile URL (e.g. https://github.com/aadityaraj1325).`
            );
        }

        let preview = null;
        let valid = true;
        let error = null;

        try {
            if (platform === "github") {
                const user = await githubService.fetchUserProfile(handle, token);
                preview = {
                    name: user.name || user.username,
                    username: user.username,
                    avatarUrl: user.avatarUrl,
                    bio: user.bio,
                    publicRepos: user.publicRepos,
                    followers: user.followers,
                    tokenStatus: user.tokenStatus,
                    tokenWarning: user.tokenWarning || null,
                };
            } else if (platform === "codeforces") {
                const user = await codeforcesService.fetchCodeforcesProfile(handle);
                preview = {
                    handle: user.handle,
                    rating: user.rating,
                    maxRating: user.maxRating,
                    rank: user.rank,
                    avatar: user.avatar,
                };
            } else if (platform === "leetcode") {
                const stats = await leetcodeService.fetchLeetCodeStats(handle);
                preview = {
                    username: stats.username,
                    totalSolved: stats.totalSolved,
                    easySolved: stats.easySolved,
                    mediumSolved: stats.mediumSolved,
                    hardSolved: stats.hardSolved,
                    ranking: stats.ranking,
                };
            } else {
                preview = {
                    handle,
                    profileUrl,
                    statusText: "Public profile link validated.",
                };
            }
        } catch (err) {
            // If GitHub failed and token was provided, retry unauthenticated as fallback
            if (platform === "github" && token) {
                try {
                    const user = await githubService.fetchUserProfile(handle, null);
                    preview = {
                        name: user.name || user.username,
                        username: user.username,
                        avatarUrl: user.avatarUrl,
                        bio: user.bio,
                        publicRepos: user.publicRepos,
                        followers: user.followers,
                        tokenStatus: "invalid_or_expired",
                        tokenWarning:
                            "The Personal Access Token was rejected by GitHub (401 Bad credentials / expired). Public profile was verified successfully without the token.",
                    };
                    valid = true;
                    error = null;
                } catch (fallbackErr) {
                    valid = false;
                    error = fallbackErr.message || "Failed to verify profile.";
                }
            } else {
                valid = false;
                error = err.message || "Failed to verify profile.";
            }

            if (!valid && wasEmail) {
                error += ` Note: You entered an email. For ${platform}, please enter your public username (e.g. ${handle}) or complete profile URL.`;
            }
        }

        res.json({
            valid,
            platform,
            handle,
            profileUrl,
            preview,
            tokenWarning: preview?.tokenWarning || null,
            error,
        });
    })
);

/**
 * POST /connect
 * Connects or updates a platform handle/link and triggers immediate sync
 */
router.post(
    "/connect",
    validate(connectSchema),
    asyncHandler(async (req, res) => {
        const profile = await getOrCreateProfile(req.user._id);
        const { platform: requestedPlatform, handle: rawInput, connectionType = "public_profile", token } = req.body;

        // Auto-sanitize full URLs or emails into clean handle and platform
        const { platform, handle } = sanitizePlatformAndHandle(requestedPlatform, rawInput);
        if (!handle) {
            throw ApiError.badRequest("Please provide a valid handle or profile link.");
        }

        const profileUrl = generateProfileUrl(platform, handle);

        const existingIndex = profile.platforms.findIndex((p) => p.platform === platform);
        if (existingIndex >= 0) {
            profile.platforms[existingIndex].handle = handle;
            profile.platforms[existingIndex].profileUrl = profileUrl;
            profile.platforms[existingIndex].connectionType = connectionType;
            profile.platforms[existingIndex].status = "connected";
            if (token) profile.platforms[existingIndex].token = token;
        } else {
            profile.platforms.push({
                platform,
                handle,
                profileUrl,
                connectionType,
                status: "connected",
                token: token || null,
            });
        }

        await profile.save();

        // Attempt initial sync
        let syncResult = null;
        let syncError = null;
        try {
            syncResult = await syncPlatform(req.user._id, platform);
        } catch (err) {
            // If initial sync failed due to token or rate limits, clear broken token and retry unauthenticated
            if (token) {
                try {
                    const targetPlatform = profile.platforms.find((p) => p.platform === platform);
                    if (targetPlatform) {
                        targetPlatform.token = null;
                        targetPlatform.connectionType = "public_profile";
                        await profile.save();
                        syncResult = await syncPlatform(req.user._id, platform);
                    }
                } catch (retryErr) {
                    syncError = retryErr.message;
                }
            } else {
                syncError = err.message;
            }
        }

        const updatedProfile = await DeveloperProfile.findById(profile._id);
        res.status(201).json({
            profile: updatedProfile,
            syncResult,
            syncError,
            sanitizedHandle: handle,
            canonicalProfileUrl: profileUrl,
        });
    })
);

/**
 * DELETE /disconnect/:platform
 */
router.delete(
    "/disconnect/:platform",
    asyncHandler(async (req, res) => {
        const profile = await getOrCreateProfile(req.user._id);
        const { platform } = req.params;

        profile.platforms = profile.platforms.filter((p) => p.platform !== platform);
        await recalculateProfileSummary(profile);
        await profile.save();

        // Delete activities from this platform if user wants fresh disconnect
        await PlatformActivity.deleteMany({ userId: req.user._id, platform });
        await syncSkillEvidenceForUser(req.user._id, profile.targetRole);

        res.json({ profile, message: `Disconnected ${platform}.` });
    })
);

/**
 * POST /sync/:platform
 */
router.post(
    "/sync/:platform",
    asyncHandler(async (req, res) => {
        const { platform } = req.params;
        if (platform === "all") {
            const results = await syncAllPlatforms(req.user._id);
            const profile = await DeveloperProfile.findOne({ userId: req.user._id });
            return res.json({ profile, results });
        }

        const result = await syncPlatform(req.user._id, platform);
        const profile = await DeveloperProfile.findOne({ userId: req.user._id });
        res.json({ profile, result });
    })
);

/**
 * GET /repositories
 * Returns synchronized repositories with search, language, visibility and sort filters
 */
router.get(
    "/repositories",
    asyncHandler(async (req, res) => {
        const { search, language, sort = "updated", visibility } = req.query;
        const filter = { userId: req.user._id, platform: "github", isDeleted: false };

        if (language && language !== "all") {
            filter.language = language;
        }

        if (visibility && visibility !== "all") {
            filter.visibility = visibility;
        }

        if (search && search.trim()) {
            filter.$or = [
                { name: { $regex: search.trim(), $options: "i" } },
                { description: { $regex: search.trim(), $options: "i" } },
            ];
        }

        let sortObj = { updatedAt: -1 };
        if (sort === "stars") sortObj = { stars: -1, updatedAt: -1 };
        else if (sort === "name") sortObj = { name: 1 };
        else if (sort === "created") sortObj = { createdAt: -1 };
        else if (sort === "pushed") sortObj = { pushedAt: -1 };

        const repositories = await PlatformRepository.find(filter).sort(sortObj);
        const totalCount = await PlatformRepository.countDocuments({
            userId: req.user._id,
            platform: "github",
            isDeleted: false,
        });

        // Distinct languages for dropdown
        const languages = await PlatformRepository.distinct("language", {
            userId: req.user._id,
            platform: "github",
            isDeleted: false,
            language: { $ne: null },
        });

        const profile = await DeveloperProfile.findOne({ userId: req.user._id });
        const ghConn = profile?.platforms?.find((p) => p.platform === "github");

        res.json({
            repositories,
            totalCount,
            languages: languages.filter(Boolean).sort(),
            lastSyncedAt: ghConn?.lastSyncAt || null,
        });
    })
);

/**
 * GET /sync-logs
 * Returns audit logs of previous synchronization runs
 */
router.get(
    "/sync-logs",
    asyncHandler(async (req, res) => {
        const { platform, limit = 10 } = req.query;
        const filter = { userId: req.user._id };
        if (platform && platform !== "all") {
            filter.platform = platform;
        }

        const logs = await PlatformSyncLog.find(filter)
            .sort({ createdAt: -1 })
            .limit(Math.min(50, Math.max(1, Number(limit) || 10)));

        res.json({ logs });
    })
);

/**
 * GET /rate-limit
 * Returns GitHub API rate-limit quota and remaining allowances
 */
router.get(
    "/rate-limit",
    asyncHandler(async (req, res) => {
        const profile = await getOrCreateProfile(req.user._id);
        const ghConn = profile.platforms.find((p) => p.platform === "github");
        const rateLimit = await githubService.fetchRateLimitStatus(ghConn?.token || null);
        res.json({ rateLimit });
    })
);

/**
 * GET /daily-health
 * Per-day tracking of what work was completed or if connections are in verified standby
 */
router.get(
    "/daily-health",
    asyncHandler(async (req, res) => {
        const profile = await getOrCreateProfile(req.user._id);
        const daysCount = Math.min(30, Math.max(1, Number(req.query.days) || 7));

        const now = new Date();
        const dates = [];
        for (let i = 0; i < daysCount; i++) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            dates.push(d.toISOString().slice(0, 10));
        }

        const activities = await PlatformActivity.find({
            userId: req.user._id,
            activityDate: { $in: dates },
        }).sort({ timestamp: -1 });

        const sessions = await CodingSession.find({
            userId: req.user._id,
            sessionDate: { $in: dates },
        });

        const activitiesByDateAndPlatform = new Map();
        for (const act of activities) {
            const key = `${act.activityDate}::${act.platform}`;
            if (!activitiesByDateAndPlatform.has(key)) {
                activitiesByDateAndPlatform.set(key, []);
            }
            activitiesByDateAndPlatform.get(key).push(act);
        }

        const sessionsByDate = new Map();
        for (const s of sessions) {
            if (!sessionsByDate.has(s.sessionDate)) {
                sessionsByDate.set(s.sessionDate, []);
            }
            sessionsByDate.get(s.sessionDate).push(s);
        }

        const dailyReports = dates.map((dateStr, index) => {
            let label = dateStr;
            if (index === 0) label = "Today";
            else if (index === 1) label = "Yesterday";
            else label = `${index} days ago`;

            const platformStatuses = profile.platforms.map((conn) => {
                const key = `${dateStr}::${conn.platform}`;
                const acts = activitiesByDateAndPlatform.get(key) || [];
                const isWorkingToday = acts.length > 0;

                let statusBadge = "verified_standby";
                let summaryText = "";

                if (conn.status === "error") {
                    statusBadge = "error";
                    summaryText = conn.lastError || "Connection error. Re-verify handle or link.";
                } else if (isWorkingToday) {
                    statusBadge = "work_detected";
                    if (conn.platform === "github") {
                        const commits = acts.filter((a) => a.activityType === "commit").length;
                        const prs = acts.filter((a) => a.activityType === "pull_request").length;
                        const reposCreated = acts.filter((a) => a.activityType === "repo_created").length;
                        const parts = [];
                        if (commits > 0) parts.push(`${commits} commit${commits > 1 ? "s" : ""}`);
                        if (prs > 0) parts.push(`${prs} PR${prs > 1 ? "s" : ""}`);
                        if (reposCreated > 0) parts.push(`${reposCreated} repo created`);
                        summaryText = `${acts.length} contribution${acts.length > 1 ? "s" : ""} recorded (${parts.join(", ") || "activity verified"}).`;
                    } else if (conn.platform === "leetcode") {
                        summaryText = `${acts.length} LeetCode problem${acts.length > 1 ? "s" : ""} solved and verified.`;
                    } else if (conn.platform === "codeforces") {
                        summaryText = `${acts.length} accepted solution(s) or contest updates logged.`;
                    } else {
                        summaryText = `${acts.length} activity entries verified.`;
                    }
                } else {
                    statusBadge = "verified_standby";
                    if (conn.platform === "github") {
                        const repoCount = conn.cachedStats?.repositoriesCount || 0;
                        summaryText = `Connection healthy & verified (${repoCount} repositories tracked). No new commits or events on ${dateStr} (Standby).`;
                    } else {
                        summaryText = `Connection healthy & verified. No new events on ${dateStr} (Standby).`;
                    }
                }

                return {
                    platform: conn.platform,
                    handle: conn.handle,
                    profileUrl: conn.profileUrl,
                    connectionStatus: conn.status,
                    lastSyncAt: conn.lastSyncAt,
                    workDetected: isWorkingToday,
                    activityCount: acts.length,
                    statusBadge,
                    summaryText,
                    activities: acts.map((a) => ({
                        id: a._id,
                        title: a.title,
                        type: a.activityType,
                        sourceUrl: a.sourceUrl,
                        time: a.timestamp,
                    })),
                };
            });

            const daySessions = sessionsByDate.get(dateStr) || [];
            const focusMinutes = daySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

            return {
                date: dateStr,
                label,
                platforms: platformStatuses,
                focusMinutes,
                focusSessionsCount: daySessions.length,
                totalActivitiesCount: platformStatuses.reduce((acc, p) => acc + p.activityCount, 0),
            };
        });

        res.json({
            days: dailyReports,
            connectedCount: profile.platforms.length,
            healthyCount: profile.platforms.filter((p) => p.status === "connected").length,
            errorCount: profile.platforms.filter((p) => p.status === "error").length,
        });
    })
);

/**
 * GET /overview
 * Aggregated stats with date range and platform filter
 */
router.get(
    "/overview",
    asyncHandler(async (req, res) => {
        const profile = await getOrCreateProfile(req.user._id);
        const { range = "all", platform } = req.query;

        const filter = { userId: req.user._id };
        if (platform && platform !== "all") {
            filter.platform = platform;
        }

        if (range !== "all") {
            const now = new Date();
            let days = 30;
            if (range === "7d") days = 7;
            else if (range === "30d") days = 30;
            else if (range === "90d") days = 90;
            else if (range === "6m") days = 180;
            else if (range === "1y") days = 365;

            const sinceDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
            const sinceDateStr = sinceDate.toISOString().slice(0, 10);
            filter.activityDate = { $gte: sinceDateStr };
        }

        const activities = await PlatformActivity.find(filter).sort({ timestamp: -1 });

        // Calculate breakdown for the filtered window
        let problemsSolved = 0;
        let easyCount = 0;
        let mediumCount = 0;
        let hardCount = 0;
        let commits = 0;
        let pullRequests = 0;
        let contestCount = 0;
        const activeDates = new Set();
        const platformCounts = {};

        for (const act of activities) {
            activeDates.add(act.activityDate);
            platformCounts[act.platform] = (platformCounts[act.platform] || 0) + 1;

            if (act.activityType === "problem_solved") {
                problemsSolved++;
                const diff = act.metadata?.difficulty;
                if (diff === "Easy") easyCount++;
                else if (diff === "Hard") hardCount++;
                else mediumCount++;
            } else if (act.activityType === "commit") {
                commits += act.metadata?.commitCount || 1;
            } else if (act.activityType === "pull_request") {
                pullRequests++;
            } else if (act.activityType === "contest") {
                contestCount++;
            }
        }

        const platformBreakdown = Object.entries(platformCounts).map(([name, count]) => ({
            platform: name,
            activityCount: count,
        }));

        res.json({
            totals: {
                problemsSolved: range === "all" ? profile.statsSummary?.totalProblemsSolved || problemsSolved : problemsSolved,
                easySolved: range === "all" ? profile.statsSummary?.easyProblemsSolved || easyCount : easyCount,
                mediumSolved: range === "all" ? profile.statsSummary?.mediumProblemsSolved || mediumCount : mediumCount,
                hardSolved: range === "all" ? profile.statsSummary?.hardProblemsSolved || hardCount : hardCount,
                githubCommits: commits,
                githubPullRequests: pullRequests,
                githubContributions: commits + pullRequests,
                githubPublicRepos: profile.statsSummary?.githubPublicRepos || 0,
                githubStars: profile.statsSummary?.githubStars || 0,
                activeDays: activeDates.size,
                contestsAttended: contestCount,
                currentRating: profile.statsSummary?.currentRating,
                maxRating: profile.statsSummary?.maxRating,
                focusHours: Math.round((profile.statsSummary?.totalFocusMinutes || 0) / 60 * 10) / 10,
            },
            platformBreakdown,
            range,
            totalActivitiesCount: activities.length,
        });
    })
);

/**
 * GET /calendar
 * 365-day contribution calendar heatmap with streaks
 */
router.get(
    "/calendar",
    asyncHandler(async (req, res) => {
        const { platform } = req.query;
        const filter = { userId: req.user._id };
        if (platform && platform !== "all") {
            filter.platform = platform;
        }

        const oneYearAgo = new Date();
        oneYearAgo.setDate(oneYearAgo.getDate() - 365);
        filter.activityDate = { $gte: oneYearAgo.toISOString().slice(0, 10) };

        const activities = await PlatformActivity.find(filter).select("activityDate activityType platform");
        const sessions = await CodingSession.find({
            userId: req.user._id,
            sessionDate: { $gte: oneYearAgo.toISOString().slice(0, 10) },
        }).select("sessionDate durationMinutes");

        const dailyCounts = {};

        for (const act of activities) {
            const d = act.activityDate;
            if (!dailyCounts[d]) {
                dailyCounts[d] = { count: 0, types: {}, platforms: new Set() };
            }
            dailyCounts[d].count += 1;
            dailyCounts[d].types[act.activityType] = (dailyCounts[d].types[act.activityType] || 0) + 1;
            dailyCounts[d].platforms.add(act.platform);
        }

        for (const s of sessions) {
            const d = s.sessionDate;
            if (!dailyCounts[d]) {
                dailyCounts[d] = { count: 0, types: {}, platforms: new Set() };
            }
            dailyCounts[d].count += 1;
            dailyCounts[d].types["focus_session"] = (dailyCounts[d].types["focus_session"] || 0) + 1;
            dailyCounts[d].platforms.add("focus_timer");
        }

        // Merge real GitHub contribution calendar if available
        if (!platform || platform === "all" || platform === "github") {
            const profile = await getOrCreateProfile(req.user._id);
            const ghConn = profile.platforms.find((p) => p.platform === "github");
            const ghDays = ghConn?.cachedStats?.contributionCalendar?.days || [];
            for (const item of ghDays) {
                if (item.count > 0 && item.date) {
                    const d = item.date;
                    if (!dailyCounts[d]) {
                        dailyCounts[d] = { count: 0, types: {}, platforms: new Set() };
                    }
                    dailyCounts[d].count = Math.max(dailyCounts[d].count, item.count);
                    dailyCounts[d].types["github_contribution"] = item.count;
                    dailyCounts[d].platforms.add("github");
                }
            }
        }

        const calendarDays = Object.entries(dailyCounts).map(([date, data]) => ({
            date,
            count: data.count,
            types: data.types,
            platforms: Array.from(data.platforms),
        }));

        // Calculate streaks
        const sortedDates = Object.keys(dailyCounts).sort();
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        const todayStr = new Date().toISOString().slice(0, 10);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);

        if (dailyCounts[todayStr] || dailyCounts[yesterdayStr]) {
            let checkDate = dailyCounts[todayStr] ? new Date() : yesterday;
            while (true) {
                const dateKey = checkDate.toISOString().slice(0, 10);
                if (dailyCounts[dateKey]) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        let prevDate = null;
        for (const dStr of sortedDates) {
            const currDate = new Date(dStr);
            if (prevDate) {
                const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    tempStreak++;
                } else {
                    tempStreak = 1;
                }
            } else {
                tempStreak = 1;
            }
            if (tempStreak > longestStreak) longestStreak = tempStreak;
            prevDate = currDate;
        }

        res.json({
            days: calendarDays,
            totalActiveDays: sortedDates.length,
            currentStreak,
            longestStreak,
        });
    })
);

/**
 * GET /activities
 * Activity timeline with pagination and filtering
 */
router.get(
    "/activities",
    asyncHandler(async (req, res) => {
        const { platform, type, date, page = 1, limit = 20 } = req.query;

        const filter = { userId: req.user._id };
        if (platform && platform !== "all") filter.platform = platform;
        if (type && type !== "all") filter.activityType = type;
        if (date) filter.activityDate = date;

        const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

        const [activities, totalCount] = await Promise.all([
            PlatformActivity.find(filter)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(Number(limit)),
            PlatformActivity.countDocuments(filter),
        ]);

        const todayStr = new Date().toISOString().slice(0, 10);
        const todayActivities = await PlatformActivity.find({
            userId: req.user._id,
            activityDate: todayStr,
        });
        const todaySessions = await CodingSession.find({
            userId: req.user._id,
            sessionDate: todayStr,
        });

        const problemsToday = todayActivities.filter((a) => a.activityType === "problem_solved").length;
        const commitsToday = todayActivities.filter((a) => a.activityType === "commit").length;
        const focusMinsToday = todaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

        let dailySummary = "No activities recorded yet today.";
        if (problemsToday > 0 || commitsToday > 0 || focusMinsToday > 0) {
            const parts = [];
            if (problemsToday > 0) parts.push(`solved ${problemsToday} problem${problemsToday > 1 ? "s" : ""}`);
            if (commitsToday > 0) parts.push(`made ${commitsToday} GitHub commit${commitsToday > 1 ? "s" : ""}`);
            if (focusMinsToday > 0) parts.push(`completed ${focusMinsToday} minutes of focused learning`);
            dailySummary = `Today you ${parts.join(", ")}.`;
        }

        res.json({
            activities,
            totalCount,
            page: Number(page),
            totalPages: Math.ceil(totalCount / Number(limit)) || 1,
            dailySummary,
        });
    })
);

/**
 * POST /activities/manual
 * Log a manual learning or coding activity
 */
router.post(
    "/activities/manual",
    validate(manualActivitySchema),
    asyncHandler(async (req, res) => {
        const { platform, activityType, title, description = "", sourceUrl = "", date, skillTags = [], durationMinutes = 0 } = req.body;

        const activityDate = date || new Date().toISOString().slice(0, 10);
        const timestamp = date ? new Date(`${date}T12:00:00Z`) : new Date();

        const activity = await PlatformActivity.create({
            userId: req.user._id,
            platform,
            externalId: `manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            activityType,
            title,
            description,
            sourceUrl,
            timestamp,
            activityDate,
            metadata: { durationMinutes },
            skillTags,
            isManual: true,
            verified: true,
            verificationLevel: 2,
        });

        const profile = await getOrCreateProfile(req.user._id);
        await recalculateProfileSummary(profile);
        await profile.save();
        await syncSkillEvidenceForUser(req.user._id, profile.targetRole);

        res.status(201).json({ activity });
    })
);

/**
 * DELETE /activities/:id
 */
router.delete(
    "/activities/:id",
    asyncHandler(async (req, res) => {
        const activity = await PlatformActivity.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!activity) {
            throw ApiError.notFound("Activity not found.");
        }

        await PlatformActivity.deleteOne({ _id: activity._id });
        const profile = await getOrCreateProfile(req.user._id);
        await recalculateProfileSummary(profile);
        await profile.save();

        res.json({ message: "Activity deleted." });
    })
);

/**
 * GET /focus-sessions
 */
router.get(
    "/focus-sessions",
    asyncHandler(async (req, res) => {
        const sessions = await CodingSession.find({ userId: req.user._id })
            .sort({ sessionDate: -1, createdAt: -1 })
            .limit(30);

        res.json({ sessions });
    })
);

/**
 * POST /focus-sessions
 * Save an active focus session from "My Developer Focus"
 */
router.post(
    "/focus-sessions",
    validate(focusSessionSchema),
    asyncHandler(async (req, res) => {
        const {
            topic,
            durationMinutes,
            startTime,
            endTime,
            sessionDate,
            problemsAttempted = 0,
            projectWork = "",
            learningObjective = "",
            reflection = "",
            skillsPracticed = [],
        } = req.body;

        const effectiveDate = sessionDate || new Date().toISOString().slice(0, 10);

        const session = await CodingSession.create({
            userId: req.user._id,
            topic,
            durationMinutes,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            sessionDate: effectiveDate,
            problemsAttempted,
            projectWork,
            learningObjective,
            reflection,
            skillsPracticed,
            completed: true,
        });

        await PlatformActivity.create({
            userId: req.user._id,
            platform: "focus_timer",
            externalId: `focus_${session._id}`,
            activityType: "focus_session",
            title: `Focus Session: ${topic} (${durationMinutes}m)`,
            description: reflection || learningObjective || `Completed ${durationMinutes} minutes of focused coding.`,
            sourceUrl: "",
            timestamp: new Date(endTime),
            activityDate: effectiveDate,
            metadata: { durationMinutes, problemsAttempted, projectWork },
            skillTags: skillsPracticed.length > 0 ? skillsPracticed : ["Focus Session"],
            isManual: true,
            verified: true,
            verificationLevel: 2,
        });

        const profile = await getOrCreateProfile(req.user._id);
        await recalculateProfileSummary(profile);
        await profile.save();
        await syncSkillEvidenceForUser(req.user._id, profile.targetRole);

        res.status(201).json({ session });
    })
);

/**
 * GET /proof-of-work
 * Returns the Proof-of-Work Career Graph data
 */
router.get(
    "/proof-of-work",
    asyncHandler(async (req, res) => {
        const profile = await getOrCreateProfile(req.user._id);
        const targetRole = req.query.targetRole || profile.targetRole || "Full Stack Engineer";

        const readinessData = await getTargetJobReadiness(req.user._id, targetRole);
        res.json({ readiness: readinessData });
    })
);

/**
 * GET /skill-intelligence
 * Growth and weakness recommendations based on real data
 */
router.get(
    "/skill-intelligence",
    asyncHandler(async (req, res) => {
        const profile = await getOrCreateProfile(req.user._id);
        const activities = await PlatformActivity.find({ userId: req.user._id });
        const evidence = await SkillEvidence.find({ userId: req.user._id });

        const recommendations = [];

        const solvedCount = profile.statsSummary?.totalProblemsSolved || 0;
        const commitsCount = profile.statsSummary?.githubCommits || 0;
        const reposCount = profile.statsSummary?.githubPublicRepos || 0;
        const totalFocusMins = profile.statsSummary?.totalFocusMinutes || 0;

        if (solvedCount >= 15 && reposCount <= 1) {
            recommendations.push({
                type: "project_balance",
                priority: "high",
                title: "Convert Algorithmic Practice into a Documented Project",
                description: `You have completed ${solvedCount} problem solutions, but only ${reposCount} public project repositories. Building and documenting a production-grade application will provide concrete proof of full-stack engineering skills.`,
                suggestedAction: "Create a GitHub repository showcasing an end-to-end project with architecture diagrams and API docs.",
            });
        }

        if (commitsCount >= 10 && reposCount > 0) {
            recommendations.push({
                type: "documentation",
                priority: "medium",
                title: "Elevate Repository Presentation & Architecture Notes",
                description: `You have made ${commitsCount} commits across repositories. Ensure each project features a clear README detailing architecture decisions, technologies used, and setup instructions.`,
                suggestedAction: "Audit top 2 repositories and add structured READMEs with live demos.",
            });
        }

        const missingCoreSkills = evidence.filter(
            (e) => e.targetRoleRelevance === "Core Requirement" && e.readinessStatus === "not_demonstrated"
        );
        if (missingCoreSkills.length > 0) {
            const skillNames = missingCoreSkills.map((s) => s.skillName).slice(0, 3).join(", ");
            recommendations.push({
                type: "skill_gap",
                priority: "high",
                title: `Target Role Skill Gap: ${skillNames}`,
                description: `Your selected target role (${profile.targetRole}) requires demonstrated work in ${skillNames}, but no verified platform activity has been detected yet.`,
                suggestedAction: `Log focused study sessions or build a feature exercising ${missingCoreSkills[0]?.skillName}.`,
            });
        }

        if (totalFocusMins < 120) {
            recommendations.push({
                type: "focus_consistency",
                priority: "medium",
                title: "Establish a Daily Focused Coding Routine",
                description: "Tracking focused deep work sessions drastically improves technical retention compared to sporadic activity.",
                suggestedAction: "Use 'My Developer Focus' timer to log at least three 45-minute sessions this week.",
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                type: "momentum",
                priority: "low",
                title: "Strong Momentum Across Coding Platforms",
                description: "Your platform activity demonstrates healthy balance. Continue shipping features and participating in timed contests to maintain edge.",
                suggestedAction: "Attempt 2 Medium-level problems this week and push regular commits.",
            });
        }

        res.json({ recommendations });
    })
);

/**
 * GET /resume-bridge
 * Suggested resume improvements from verified developer activity
 */
router.get(
    "/resume-bridge",
    asyncHandler(async (req, res) => {
        const suggestions = await getResumeBridgeSuggestions(req.user._id);
        res.json({ suggestions });
    })
);

/**
 * POST /resume-bridge/apply
 * Applies approved bullet to user's resume, creating a new ResumeVersion
 */
router.post(
    "/resume-bridge/apply",
    validate(applyBridgeSchema),
    asyncHandler(async (req, res) => {
        const result = await applyResumeBridgeSuggestion(req.user._id, req.body);
        res.status(201).json(result);
    })
);

/**
 * POST /coach/chat
 * Ask Developer Coach AI
 */
router.post(
    "/coach/chat",
    validate(coachChatSchema),
    asyncHandler(async (req, res) => {
        const coachResponse = await askDeveloperCoach(req.user._id, req.body.question);
        res.json({ coachResponse });
    })
);

/**
 * GET /reports/:type
 * Generates structured report payload for export
 */
router.get(
    "/reports/:type",
    asyncHandler(async (req, res) => {
        const { type } = req.params;
        const profile = await getOrCreateProfile(req.user._id);
        const activities = await PlatformActivity.find({ userId: req.user._id }).sort({ timestamp: -1 });
        const sessions = await CodingSession.find({ userId: req.user._id }).sort({ sessionDate: -1 });
        const readiness = await getTargetJobReadiness(req.user._id, profile.targetRole);

        const report = {
            reportType: type,
            generatedAt: new Date(),
            userTargetRole: profile.targetRole,
            connectedPlatforms: profile.platforms.map((p) => ({
                platform: p.platform,
                handle: p.handle,
                status: p.status,
                lastSyncAt: p.lastSyncAt,
            })),
            overallStats: profile.statsSummary,
            totalActivitiesLogged: activities.length,
            totalFocusMinutes: sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0),
            readinessPercentage: readiness.readinessPercentage,
            readinessCounts: readiness.counts,
            topSkillsDemonstrated: readiness.skills.demonstrated.map((s) => s.skillName),
            areasForImprovement: readiness.skills.needsPracticalEvidence
                .concat(readiness.skills.notDemonstrated)
                .map((s) => s.skillName),
            recentHighlights: activities.slice(0, 8).map((a) => ({
                platform: a.platform,
                title: a.title,
                date: a.activityDate,
                type: a.activityType,
            })),
        };

        res.json({ report });
    })
);

module.exports = router;

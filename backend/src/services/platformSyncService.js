/**
 * Platform Synchronization Service
 * Coordinates separate repository sync, commit sync, activity deduplication,
 * profile caching, sync logging, and skill evidence updates across all connected platforms.
 */

const DeveloperProfile = require("../models/DeveloperProfile");
const PlatformActivity = require("../models/PlatformActivity");
const PlatformRepository = require("../models/PlatformRepository");
const PlatformSyncLog = require("../models/PlatformSyncLog");
const CodingSession = require("../models/CodingSession");
const githubService = require("./githubIntegrationService");
const codeforcesService = require("./codeforcesIntegrationService");
const leetcodeService = require("./leetcodeIntegrationService");
const { syncSkillEvidenceForUser } = require("./skillEvidenceService");

/**
 * Separate GitHub Synchronization Pipeline
 * Performs distinct repository synchronization, commit tracking,
 * public events sync, and contribution calendar updates.
 */
async function syncGitHub(userId, platformConfig, syncType = "manual") {
    const startTime = Date.now();
    const handle = platformConfig.handle;
    const token = platformConfig.token || null;

    // 1. Fetch Profile & Rate Limits
    const userProfile = await githubService.fetchUserProfile(handle, token);

    // If token was rejected/invalid, clear it from platformConfig
    if (userProfile.tokenStatus === "invalid_or_expired") {
        platformConfig.token = null;
        platformConfig.connectionType = "public_profile";
        platformConfig.lastError = null;
    }

    const rateLimit = await githubService.fetchRateLimitStatus(platformConfig.token);

    // 2. SEPARATE REPOSITORY SYNCHRONIZATION
    // Fetch all repositories (up to 100 with pagination)
    const fetchedRepos = await githubService.fetchUserRepos(handle, platformConfig.token, 100);

    // Compare with existing repositories in MongoDB
    const existingRepos = await PlatformRepository.find({ userId, platform: "github" });
    const existingMap = new Map(existingRepos.map((r) => [r.githubRepoId, r]));

    const newRepos = [];
    const updatedRepos = [];
    const bulkRepoOps = [];

    for (const repo of fetchedRepos) {
        const existing = existingMap.get(repo.id);

        if (!existing) {
            newRepos.push(repo);
        } else {
            const hasChanged =
                existing.name !== repo.name ||
                existing.description !== repo.description ||
                existing.stars !== repo.stars ||
                existing.forks !== repo.forks ||
                existing.language !== repo.language ||
                (repo.pushedAt && (!existing.pushedAt || existing.pushedAt.getTime() !== repo.pushedAt.getTime()));

            if (hasChanged) {
                updatedRepos.push(repo);
            }
        }

        bulkRepoOps.push({
            updateOne: {
                filter: { userId, platform: "github", githubRepoId: repo.id },
                update: {
                    $set: {
                        name: repo.name,
                        fullName: repo.fullName,
                        ownerLogin: repo.ownerLogin,
                        description: repo.description,
                        htmlUrl: repo.htmlUrl,
                        visibility: repo.visibility,
                        defaultBranch: repo.defaultBranch,
                        language: repo.language,
                        topics: repo.topics,
                        stars: repo.stars,
                        forks: repo.forks,
                        openIssuesCount: repo.openIssuesCount,
                        isFork: repo.isFork,
                        isArchived: repo.isArchived,
                        isDeleted: false,
                        createdAt: repo.createdAt,
                        updatedAt: repo.updatedAt,
                        pushedAt: repo.pushedAt,
                        lastSyncedAt: new Date(),
                    },
                },
                upsert: true,
            },
        });
    }

    if (bulkRepoOps.length > 0) {
        await PlatformRepository.bulkWrite(bulkRepoOps, { ordered: false });
    }

    // 3. SEPARATE COMMIT & REPOSITORY ACTIVITY SYNCHRONIZATION
    const newActivities = [];

    // For all newly detected repositories, record a repository creation activity
    for (const repo of newRepos) {
        const repoCreatedAct = githubService.normalizeRepoCreatedActivity(repo, userId);
        newActivities.push(repoCreatedAct);
    }

    // For the user's recently pushed repositories, fetch direct commits
    // This ensures commits are tracked even if GitHub's Public Events API dropped them
    const activeRepos = [...fetchedRepos]
        .filter((r) => !r.isFork)
        .sort((a, b) => new Date(b.pushedAt || b.updatedAt) - new Date(a.pushedAt || a.updatedAt))
        .slice(0, 8);

    let directCommitsCount = 0;
    for (const r of activeRepos) {
        const commits = await githubService.fetchRepoCommits(r.ownerLogin, r.name, handle, platformConfig.token, 15);
        if (commits.length > 0) {
            directCommitsCount += commits.length;
            const commitActivities = githubService.normalizeRepoCommits(commits, r.name, r.ownerLogin, userId);
            newActivities.push(...commitActivities);
        }
    }

    // 4. PUBLIC EVENTS SYNCHRONIZATION (Push events, PRs, issues)
    const events = await githubService.fetchUserEvents(handle, platformConfig.token);
    const eventActivities = githubService.normalizeGitHubEvents(events, handle, userId);
    newActivities.push(...eventActivities);

    // 5. CONTRIBUTION CALENDAR SYNCHRONIZATION
    const calendarData = await githubService.fetchContributionCalendar(handle, platformConfig.token);

    // 6. DEDUPLICATE & BULK UPSERT ACTIVITIES
    if (newActivities.length > 0) {
        const bulkActOps = newActivities.map((act) => ({
            updateOne: {
                filter: {
                    userId: act.userId,
                    platform: act.platform,
                    externalId: act.externalId,
                },
                update: { $set: act },
                upsert: true,
            },
        }));
        await PlatformActivity.bulkWrite(bulkActOps, { ordered: false });
    }

    // 7. AGGREGATE REPOSITORY STATISTICS
    const repoStats = githubService.aggregateGitHubRepoStats(fetchedRepos);
    const totalReposInDb = await PlatformRepository.countDocuments({ userId, platform: "github", isDeleted: false });

    const durationMs = Date.now() - startTime;
    let summary = `GitHub synchronized successfully in ${durationMs}ms.`;
    if (newRepos.length > 0) {
        const names = newRepos.map((r) => r.name).slice(0, 3).join(", ");
        summary += ` ${newRepos.length} new ${newRepos.length === 1 ? "repository" : "repositories"} detected (${names}).`;
    }
    if (updatedRepos.length > 0) {
        summary += ` ${updatedRepos.length} repositories updated.`;
    }
    if (newActivities.length > 0) {
        summary += ` ${newActivities.length} activities verified.`;
    }

    const updatedStats = {
        username: userProfile.username,
        publicRepos: totalReposInDb,
        followers: userProfile.followers,
        totalStars: repoStats.totalStars,
        totalForks: repoStats.totalForks,
        languages: repoStats.languageDistribution,
        recentEventCount: events.length,
        repositoriesCount: totalReposInDb,
        newRepositoriesDetected: newRepos.length,
        updatedRepositoriesCount: updatedRepos.length,
        directCommitsFound: directCommitsCount,
        contributionCalendar: calendarData,
        rateLimit: rateLimit,
        lastSyncSummary: summary,
        tokenWarning: userProfile.tokenWarning || null,
    };

    // 8. LOG TO PLATFORMSYNCLOG
    await PlatformSyncLog.create({
        userId,
        platform: "github",
        syncType,
        status: "success",
        summary,
        repositoriesDiscovered: fetchedRepos.length,
        newRepositoriesCount: newRepos.length,
        updatedRepositoriesCount: updatedRepos.length,
        activitiesCount: newActivities.length,
        commitsCount: directCommitsCount,
        rateLimitRemaining: rateLimit?.remaining || null,
        rateLimitLimit: rateLimit?.limit || null,
        rateLimitReset: rateLimit?.reset || null,
        durationMs,
    });

    return {
        updatedStats,
        newActivitiesCount: newActivities.length,
        newRepositoriesCount: newRepos.length,
        updatedRepositoriesCount: updatedRepos.length,
        repositoriesDiscovered: fetchedRepos.length,
        summary,
        rateLimit,
    };
}

/**
 * Sync a single connected platform for a user
 */
async function syncPlatform(userId, platformName, syncType = "manual") {
    const profile = await DeveloperProfile.findOne({ userId });
    if (!profile) {
        throw new Error("Developer profile not found.");
    }

    const platformConfig = profile.platforms.find((p) => p.platform === platformName);
    if (!platformConfig) {
        throw new Error(`Platform "${platformName}" is not connected.`);
    }

    const handle = platformConfig.handle;
    platformConfig.status = "syncing";
    await profile.save();

    let newActivitiesCount = 0;
    let updatedStats = {};
    let syncSummary = "";
    let rateLimit = null;
    let newReposCount = 0;
    let updatedReposCount = 0;
    let reposDiscovered = 0;

    try {
        if (platformName === "github") {
            const ghResult = await syncGitHub(userId, platformConfig, syncType);
            updatedStats = ghResult.updatedStats;
            newActivitiesCount = ghResult.newActivitiesCount;
            newReposCount = ghResult.newRepositoriesCount;
            updatedReposCount = ghResult.updatedRepositoriesCount;
            reposDiscovered = ghResult.repositoriesDiscovered;
            syncSummary = ghResult.summary;
            rateLimit = ghResult.rateLimit;
        } else if (platformName === "codeforces") {
            const cfUser = await codeforcesService.fetchCodeforcesProfile(handle);
            const ratings = await codeforcesService.fetchCodeforcesRatingHistory(handle);
            const submissions = await codeforcesService.fetchCodeforcesSubmissions(handle, 50);

            const { activities: subActivities, uniqueSolvedCount } =
                codeforcesService.normalizeCodeforcesSubmissions(submissions, handle, userId);
            const contestActivities = codeforcesService.normalizeCodeforcesContests(ratings, handle, userId);

            const cfActivities = [...subActivities, ...contestActivities];
            if (cfActivities.length > 0) {
                const bulkOps = cfActivities.map((act) => ({
                    updateOne: {
                        filter: {
                            userId: act.userId,
                            platform: act.platform,
                            externalId: act.externalId,
                        },
                        update: { $set: act },
                        upsert: true,
                    },
                }));
                await PlatformActivity.bulkWrite(bulkOps, { ordered: false });
            }

            newActivitiesCount = cfActivities.length;
            syncSummary = `Codeforces synchronized. ${uniqueSolvedCount} problems and ${ratings.length} contests verified.`;

            updatedStats = {
                handle: cfUser.handle,
                rating: cfUser.rating,
                maxRating: cfUser.maxRating,
                rank: cfUser.rank,
                maxRank: cfUser.maxRank,
                contestsCount: ratings.length,
                solvedInRecentSubmissions: uniqueSolvedCount,
                lastSyncSummary: syncSummary,
            };

            await PlatformSyncLog.create({
                userId,
                platform: "codeforces",
                syncType,
                status: "success",
                summary: syncSummary,
                activitiesCount: cfActivities.length,
            });
        } else if (platformName === "leetcode") {
            const lcStats = await leetcodeService.fetchLeetCodeStats(handle);
            const subActivities = leetcodeService.normalizeLeetCodeSubmissions(
                lcStats.recentSubmissions,
                handle,
                userId
            );

            if (subActivities.length > 0) {
                const bulkOps = subActivities.map((act) => ({
                    updateOne: {
                        filter: {
                            userId: act.userId,
                            platform: act.platform,
                            externalId: act.externalId,
                        },
                        update: { $set: act },
                        upsert: true,
                    },
                }));
                await PlatformActivity.bulkWrite(bulkOps, { ordered: false });
            }

            newActivitiesCount = subActivities.length;
            syncSummary = `LeetCode synchronized. ${lcStats.totalSolved} problems verified.`;

            updatedStats = {
                username: lcStats.username,
                ranking: lcStats.ranking,
                totalSolved: lcStats.totalSolved,
                easySolved: lcStats.easySolved,
                mediumSolved: lcStats.mediumSolved,
                hardSolved: lcStats.hardSolved,
                languages: lcStats.languages,
                lastSyncSummary: syncSummary,
            };

            await PlatformSyncLog.create({
                userId,
                platform: "leetcode",
                syncType,
                status: "success",
                summary: syncSummary,
                activitiesCount: subActivities.length,
            });
        } else {
            platformConfig.connectionType = "public_profile";
            syncSummary = `Public profile linked for ${platformName}.`;
            updatedStats = {
                handle,
                statusText: syncSummary,
                lastSyncSummary: syncSummary,
            };
        }

        // Update platform status
        platformConfig.status = "connected";
        platformConfig.lastSyncAt = new Date();
        platformConfig.lastError = null;
        platformConfig.cachedStats = updatedStats;

        // Recalculate summary stats for the whole profile
        await recalculateProfileSummary(profile);
        await profile.save();

        // Refresh skill evidence matrix
        await syncSkillEvidenceForUser(userId, profile.targetRole);

        return {
            platform: platformName,
            status: "connected",
            syncedActivitiesCount: newActivitiesCount,
            repositoriesDiscovered: reposDiscovered,
            newRepositoriesCount: newReposCount,
            updatedRepositoriesCount: updatedReposCount,
            rateLimit,
            summary: syncSummary,
            stats: updatedStats,
        };
    } catch (err) {
        platformConfig.status = "error";
        platformConfig.lastError = err.message || "Sync failed";
        await profile.save();

        await PlatformSyncLog.create({
            userId,
            platform: platformName,
            syncType,
            status: "failed",
            summary: `Sync failed: ${err.message}`,
            error: err.message,
        });

        throw err;
    }
}

/**
 * Synchronize all connected platforms for a user
 */
async function syncAllPlatforms(userId, syncType = "manual") {
    const profile = await DeveloperProfile.findOne({ userId });
    if (!profile) throw new Error("Profile not found.");

    const results = [];
    for (const p of profile.platforms) {
        try {
            const res = await syncPlatform(userId, p.platform, syncType);
            results.push({ platform: p.platform, success: true, data: res });
        } catch (err) {
            results.push({ platform: p.platform, success: false, error: err.message });
        }
    }
    return results;
}

/**
 * Re-aggregates profile-level total statistics from PlatformRepository, PlatformActivity, and CodingSession
 */
async function recalculateProfileSummary(profile) {
    const userId = profile.userId;

    const allActivities = await PlatformActivity.find({ userId });
    const allSessions = await CodingSession.find({ userId });

    let totalProblemsSolved = 0;
    let easyProblemsSolved = 0;
    let mediumProblemsSolved = 0;
    let hardProblemsSolved = 0;
    let githubCommits = 0;
    let githubPullRequests = 0;
    let contestsAttended = 0;
    let cfRating = null;
    let cfMaxRating = null;

    // Distinct activity dates for active coding days
    const activeDates = new Set();

    for (const act of allActivities) {
        if (act.activityDate) activeDates.add(act.activityDate);

        if (act.activityType === "problem_solved") {
            totalProblemsSolved++;
            const diff = act.metadata?.difficulty;
            if (diff === "Easy") easyProblemsSolved++;
            else if (diff === "Hard") hardProblemsSolved++;
            else mediumProblemsSolved++;
        } else if (act.activityType === "commit") {
            const count = act.metadata?.commitCount || 1;
            if (act.platform === "github") {
                githubCommits += count;
            }
        } else if (act.activityType === "pull_request") {
            githubPullRequests++;
        } else if (act.activityType === "contest") {
            contestsAttended++;
        }
    }

    for (const s of allSessions) {
        if (s.sessionDate) activeDates.add(s.sessionDate);
    }

    // Pull authoritative counts directly from PlatformRepository
    const ghRepoCount = await PlatformRepository.countDocuments({
        userId,
        platform: "github",
        isDeleted: false,
    });

    const repoAgg = await PlatformRepository.aggregate([
        { $match: { userId, platform: "github", isDeleted: false, isFork: false } },
        { $group: { _id: null, totalStars: { $sum: "$stars" }, totalForks: { $sum: "$forks" } } },
    ]);

    const ghStars = repoAgg[0]?.totalStars || 0;

    let totalCalendarContributions = 0;

    for (const p of profile.platforms) {
        const stats = p.cachedStats || {};
        if (p.platform === "github") {
            if (stats.contributionCalendar?.totalContributions) {
                totalCalendarContributions = stats.contributionCalendar.totalContributions;
            }
        } else if (p.platform === "codeforces") {
            cfRating = stats.rating || cfRating;
            cfMaxRating = stats.maxRating || cfMaxRating;
        } else if (p.platform === "leetcode") {
            if (stats.totalSolved > totalProblemsSolved) {
                totalProblemsSolved = stats.totalSolved;
                easyProblemsSolved = stats.easySolved || easyProblemsSolved;
                mediumProblemsSolved = stats.mediumSolved || mediumProblemsSolved;
                hardProblemsSolved = stats.hardSolved || hardProblemsSolved;
            }
        }
    }

    // Calculate total focus minutes from completed sessions
    const totalFocusMinutes = allSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

    const effectiveContributions = Math.max(
        totalCalendarContributions,
        githubCommits + githubPullRequests
    );

    profile.statsSummary = {
        totalProblemsSolved,
        easyProblemsSolved,
        mediumProblemsSolved,
        hardProblemsSolved,
        githubContributionsYear: effectiveContributions,
        githubPublicRepos: ghRepoCount,
        githubStars: ghStars,
        githubCommits,
        githubPullRequests,
        activeCodingDays: activeDates.size,
        totalFocusMinutes,
        contestsAttended,
        currentRating: cfRating,
        maxRating: cfMaxRating,
        lastSyncedAt: new Date(),
    };
}

module.exports = {
    syncPlatform,
    syncAllPlatforms,
    syncGitHub,
    recalculateProfileSummary,
};

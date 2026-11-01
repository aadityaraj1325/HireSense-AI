/**
 * LeetCode Integration Service
 * Queries LeetCode's GraphQL endpoint from backend for public profile statistics.
 * Handles rate limits, timeouts, and structure changes gracefully without fabricating stats.
 */

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

const USER_STATS_QUERY = `
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      realName
      ranking
      reputation
    }
    submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
        submissions
      }
    }
    languageProblemCount {
      languageName
      problemsSolved
    }
  }
  recentAcSubmissionList(username: $username, limit: 15) {
    id
    title
    titleSlug
    timestamp
  }
}
`;

/**
 * Fetch LeetCode public profile and submission stats
 */
async function fetchLeetCodeStats(username) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
        const res = await fetch(LEETCODE_GRAPHQL_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Referer: `https://leetcode.com/${encodeURIComponent(username)}/`,
            },
            body: JSON.stringify({
                query: USER_STATS_QUERY,
                variables: { username },
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            throw new Error(`LeetCode API returned HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        if (json.errors && json.errors.length > 0) {
            const msg = json.errors[0]?.message || "GraphQL error";
            throw new Error(`LeetCode query error: ${msg}`);
        }

        const user = json.data?.matchedUser;
        if (!user) {
            throw new Error(`LeetCode user "${username}" was not found or has a private profile.`);
        }

        const submitStats = user.submitStatsGlobal?.acSubmissionNum || [];
        const allStats = submitStats.find((s) => s.difficulty === "All") || { count: 0 };
        const easyStats = submitStats.find((s) => s.difficulty === "Easy") || { count: 0 };
        const mediumStats = submitStats.find((s) => s.difficulty === "Medium") || { count: 0 };
        const hardStats = submitStats.find((s) => s.difficulty === "Hard") || { count: 0 };

        const languages = (user.languageProblemCount || []).map((l) => ({
            language: l.languageName,
            problemsSolved: l.problemsSolved,
        }));

        const recentSubmissions = (json.data?.recentAcSubmissionList || []).map((sub) => ({
            id: sub.id,
            title: sub.title,
            titleSlug: sub.titleSlug,
            timestamp: new Date(Number(sub.timestamp) * 1000),
            sourceUrl: `https://leetcode.com/problems/${sub.titleSlug}/`,
        }));

        return {
            username: user.username,
            realName: user.profile?.realName || user.username,
            ranking: user.profile?.ranking || null,
            reputation: user.profile?.reputation || 0,
            totalSolved: allStats.count || 0,
            easySolved: easyStats.count || 0,
            mediumSolved: mediumStats.count || 0,
            hardSolved: hardStats.count || 0,
            languages,
            recentSubmissions,
        };
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") {
            throw new Error("LeetCode connection timed out. Please check your network or try again.");
        }
        throw err;
    }
}

/**
 * Normalize recent LeetCode accepted submissions into PlatformActivity records
 */
function normalizeLeetCodeSubmissions(recentSubmissions, username, userId) {
    const activities = [];

    for (const sub of recentSubmissions) {
        if (!sub || !sub.title) continue;
        const date = sub.timestamp instanceof Date ? sub.timestamp : new Date();
        const activityDate = date.toISOString().slice(0, 10);

        activities.push({
            userId,
            platform: "leetcode",
            externalId: `lc_sub_${sub.id || sub.titleSlug}`,
            activityType: "problem_solved",
            title: `Solved LeetCode: ${sub.title}`,
            description: `Accepted submission for ${sub.title}`,
            sourceUrl: sub.sourceUrl || `https://leetcode.com/problems/${sub.titleSlug || ""}/`,
            timestamp: date,
            activityDate,
            metadata: {
                titleSlug: sub.titleSlug,
                problemTitle: sub.title,
            },
            skillTags: ["Algorithms", "Data Structures", "LeetCode"],
            isManual: false,
            verified: true,
            verificationLevel: 2,
        });
    }

    return activities;
}

module.exports = {
    fetchLeetCodeStats,
    normalizeLeetCodeSubmissions,
};


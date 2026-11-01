/**
 * Codeforces Integration Service
 * Interacts with the official, public Codeforces REST API.
 * Endpoints: user.info, user.rating, user.status
 */

const CODEFORCES_API_BASE = "https://codeforces.com/api";

async function callCodeforces(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = `${CODEFORCES_API_BASE}/${endpoint}${query ? `?${query}` : ""}`;

    const res = await fetch(url, {
        headers: { "User-Agent": "HireSense-AI-Developer-Tracker" },
    });

    if (!res.ok) {
        throw new Error(`Codeforces API HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.status !== "OK") {
        throw new Error(`Codeforces API error: ${data.comment || "Unknown error"}`);
    }

    return data.result;
}

/**
 * Fetch Codeforces profile info
 */
async function fetchCodeforcesProfile(handle) {
    const result = await callCodeforces("user.info", { handles: handle });
    if (!result || !result.length) {
        throw new Error(`Codeforces user "${handle}" was not found.`);
    }

    const user = result[0];
    return {
        handle: user.handle,
        rating: user.rating || 0,
        maxRating: user.maxRating || 0,
        rank: user.rank || "unranked",
        maxRank: user.maxRank || "unranked",
        contribution: user.contribution || 0,
        avatar: user.titlePhoto || user.avatar || "",
        registrationTimeSeconds: user.registrationTimeSeconds,
    };
}

/**
 * Fetch Codeforces contest rating history
 */
async function fetchCodeforcesRatingHistory(handle) {
    try {
        const result = await callCodeforces("user.rating", { handle });
        return Array.isArray(result) ? result : [];
    } catch (err) {
        return [];
    }
}

/**
 * Fetch recent submissions for a user
 */
async function fetchCodeforcesSubmissions(handle, count = 50) {
    try {
        const result = await callCodeforces("user.status", { handle, from: 1, count });
        return Array.isArray(result) ? result : [];
    } catch (err) {
        return [];
    }
}

/**
 * Normalizes accepted submissions into PlatformActivity
 */
function normalizeCodeforcesSubmissions(submissions, handle, userId) {
    const activities = [];
    const solvedProblemIds = new Set();

    for (const sub of submissions) {
        if (!sub || sub.verdict !== "OK") continue; // only count accepted solutions
        const problem = sub.problem || {};
        const problemKey = `${problem.contestId || 0}-${problem.index || ""}`;
        if (solvedProblemIds.has(problemKey)) continue; // avoid counting duplicate accepted submissions
        solvedProblemIds.add(problemKey);

        const date = new Date((sub.creationTimeSeconds || Date.now() / 1000) * 1000);
        const activityDate = date.toISOString().slice(0, 10);
        const tags = (problem.tags || []).map((t) => {
            if (t === "dp") return "Dynamic Programming";
            if (t === "data structures") return "Data Structures";
            if (t === "graphs") return "Graph Algorithms";
            if (t === "math") return "Mathematics";
            if (t === "greedy") return "Greedy Algorithms";
            if (t === "binary search") return "Binary Search";
            return t.charAt(0).toUpperCase() + t.slice(1);
        });

        // Determine difficulty rating
        const rating = problem.rating || null;
        let difficulty = "Medium";
        if (rating) {
            if (rating < 1200) difficulty = "Easy";
            else if (rating >= 1700) difficulty = "Hard";
            else difficulty = "Medium";
        }

        activities.push({
            userId,
            platform: "codeforces",
            externalId: `cf_sub_${sub.id}`,
            activityType: "problem_solved",
            title: `Solved ${problem.name || "Problem"} [${problem.index || ""}]`,
            description: `Verdict: Accepted (${sub.programmingLanguage}). Rating: ${rating || "Unrated"}. Tags: ${tags.slice(0, 3).join(", ") || "General"}`,
            sourceUrl: problem.contestId
                ? `https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`
                : `https://codeforces.com/profile/${handle}`,
            timestamp: date,
            activityDate,
            metadata: {
                contestId: problem.contestId,
                problemIndex: problem.index,
                problemName: problem.name,
                difficulty,
                rating,
                programmingLanguage: sub.programmingLanguage,
                tags,
            },
            skillTags: ["Competitive Programming", "Algorithms", ...tags],
            isManual: false,
            verified: true,
            verificationLevel: 2,
        });
    }

    return { activities, uniqueSolvedCount: solvedProblemIds.size };
}

/**
 * Normalizes contest entries into PlatformActivity
 */
function normalizeCodeforcesContests(ratingHistory, handle, userId) {
    const activities = [];

    for (const contest of ratingHistory.slice(-10)) {
        const date = new Date((contest.ratingUpdateTimeSeconds || Date.now() / 1000) * 1000);
        const activityDate = date.toISOString().slice(0, 10);
        const ratingChange = contest.newRating - contest.oldRating;
        const sign = ratingChange >= 0 ? `+${ratingChange}` : `${ratingChange}`;

        activities.push({
            userId,
            platform: "codeforces",
            externalId: `cf_contest_${contest.contestId}`,
            activityType: "contest",
            title: `Participated in ${contest.contestName}`,
            description: `Rank: #${contest.rank}. Rating: ${contest.oldRating} → ${contest.newRating} (${sign})`,
            sourceUrl: `https://codeforces.com/contest/${contest.contestId}`,
            timestamp: date,
            activityDate,
            metadata: {
                contestId: contest.contestId,
                contestName: contest.contestName,
                rank: contest.rank,
                oldRating: contest.oldRating,
                newRating: contest.newRating,
                ratingChange,
            },
            skillTags: ["Competitive Programming", "Algorithms", "Contest"],
            isManual: false,
            verified: true,
            verificationLevel: 4, // Verifiable contest rank
        });
    }

    return activities;
}

module.exports = {
    fetchCodeforcesProfile,
    fetchCodeforcesRatingHistory,
    fetchCodeforcesSubmissions,
    normalizeCodeforcesSubmissions,
    normalizeCodeforcesContests,
};


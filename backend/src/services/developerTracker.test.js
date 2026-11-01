const test = require("node:test");
const assert = require("node:assert/strict");

const {
    normalizeGitHubEvents,
    normalizeRepoCommits,
    normalizeRepoCreatedActivity,
    aggregateGitHubRepoStats,
} = require("./githubIntegrationService");
const {
    normalizeCodeforcesSubmissions,
    normalizeCodeforcesContests,
} = require("./codeforcesIntegrationService");
const {
    normalizeLeetCodeSubmissions,
} = require("./leetcodeIntegrationService");
const {
    getRoleRequirements,
    ROLE_REQUIREMENT_MATRICES,
} = require("./skillEvidenceService");
const {
    sanitizePlatformAndHandle,
    generateProfileUrl,
} = require("../utils/platformUrlParser");

test("GitHub integration: normalizes push events into valid commit activities", () => {
    const fakeEvents = [
        {
            id: "12345",
            type: "PushEvent",
            created_at: "2026-10-31T14:00:00Z",
            repo: { name: "octocat/HireSense-AI" },
            payload: {
                ref: "refs/heads/main",
                commits: [
                    { message: "feat(tracker): add developer intelligence hub" },
                    { message: "fix(auth): fix session refresh" },
                ],
            },
        },
        {
            id: "12346",
            type: "PullRequestEvent",
            created_at: "2026-10-31T15:00:00Z",
            repo: { name: "octocat/HireSense-AI" },
            payload: {
                action: "opened",
                pull_request: {
                    number: 42,
                    title: "Add Developer Intelligence Hub",
                    body: "Implements multi-platform tracking",
                    html_url: "https://github.com/octocat/HireSense-AI/pull/42",
                },
            },
        },
    ];

    const activities = normalizeGitHubEvents(fakeEvents, "octocat", "user123");
    assert.equal(activities.length, 2);

    const commitActivity = activities[0];
    assert.equal(commitActivity.platform, "github");
    assert.equal(commitActivity.externalId, "gh_push_12345");
    assert.equal(commitActivity.activityType, "commit");
    assert.equal(commitActivity.title, "2 commits to octocat/HireSense-AI");
    assert.equal(commitActivity.activityDate, "2026-10-31");
    assert.equal(commitActivity.metadata.commitCount, 2);
    assert.equal(commitActivity.isManual, false);

    const prActivity = activities[1];
    assert.equal(prActivity.activityType, "pull_request");
    assert.equal(prActivity.metadata.prNumber, 42);
    assert.equal(prActivity.verificationLevel, 3);
});

test("GitHub integration: aggregates language counts, stars, and forks from repositories", () => {
    const fakeRepos = [
        { name: "repo1", isFork: false, stars: 12, forks: 3, language: "TypeScript" },
        { name: "repo2", isFork: false, stars: 8, forks: 1, language: "TypeScript" },
        { name: "repo3", isFork: false, stars: 5, forks: 0, language: "Python" },
        { name: "forked-repo", isFork: true, stars: 100, forks: 50, language: "Go" }, // Should be excluded from own stars
    ];

    const stats = aggregateGitHubRepoStats(fakeRepos);
    assert.equal(stats.totalStars, 25);
    assert.equal(stats.totalForks, 4);
    assert.equal(stats.repoCount, 4);

    assert.equal(stats.languageDistribution[0].language, "TypeScript");
    assert.equal(stats.languageDistribution[0].count, 2);
    assert.equal(stats.languageDistribution[1].language, "Python");
    assert.equal(stats.languageDistribution[1].count, 1);
});

test("Codeforces integration: normalizes accepted submissions and excludes duplicate problem solves", () => {
    const fakeSubmissions = [
        {
            id: 991,
            verdict: "OK",
            creationTimeSeconds: 1730380000,
            programmingLanguage: "GNU C++20",
            problem: {
                contestId: 1900,
                index: "A",
                name: "Cover in Water",
                rating: 800,
                tags: ["dp", "greedy"],
            },
        },
        {
            id: 992,
            verdict: "WRONG_ANSWER", // Should be ignored
            creationTimeSeconds: 1730381000,
            programmingLanguage: "GNU C++20",
            problem: {
                contestId: 1900,
                index: "B",
                name: "Laura and Operations",
                rating: 1100,
                tags: ["math"],
            },
        },
        {
            id: 993,
            verdict: "OK", // Same problem as 991, should not count twice
            creationTimeSeconds: 1730382000,
            programmingLanguage: "GNU C++20",
            problem: {
                contestId: 1900,
                index: "A",
                name: "Cover in Water",
                rating: 800,
                tags: ["dp", "greedy"],
            },
        },
    ];

    const { activities, uniqueSolvedCount } = normalizeCodeforcesSubmissions(fakeSubmissions, "tourist", "user123");
    assert.equal(uniqueSolvedCount, 1);
    assert.equal(activities.length, 1);

    const act = activities[0];
    assert.equal(act.platform, "codeforces");
    assert.equal(act.activityType, "problem_solved");
    assert.equal(act.title, "Solved Cover in Water [A]");
    assert.equal(act.metadata.difficulty, "Easy"); // 800 < 1200
    assert.ok(act.skillTags.includes("Dynamic Programming"));
    assert.ok(act.skillTags.includes("Greedy Algorithms"));
});

test("Codeforces integration: normalizes contest rating history entries", () => {
    const fakeRatings = [
        {
            contestId: 1980,
            contestName: "Codeforces Round 950 (Div. 3)",
            rank: 142,
            oldRating: 1450,
            newRating: 1530,
            ratingUpdateTimeSeconds: 1730390000,
        },
    ];

    const activities = normalizeCodeforcesContests(fakeRatings, "tourist", "user123");
    assert.equal(activities.length, 1);

    const contestAct = activities[0];
    assert.equal(contestAct.activityType, "contest");
    assert.equal(contestAct.metadata.rank, 142);
    assert.equal(contestAct.metadata.ratingChange, 80);
    assert.equal(contestAct.verificationLevel, 4);
});

test("LeetCode integration: normalizes accepted submissions with accurate problem titles", () => {
    const fakeSubmissions = [
        {
            id: "1001",
            title: "Two Sum",
            titleSlug: "two-sum",
            timestamp: new Date("2026-10-31T10:00:00Z"),
            sourceUrl: "https://leetcode.com/problems/two-sum/",
        },
    ];

    const activities = normalizeLeetCodeSubmissions(fakeSubmissions, "userLC", "user123");
    assert.equal(activities.length, 1);
    assert.equal(activities[0].platform, "leetcode");
    assert.equal(activities[0].title, "Solved LeetCode: Two Sum");
    assert.equal(activities[0].activityType, "problem_solved");
    assert.equal(activities[0].verificationLevel, 2);
});

test("Proof-of-Work Career Intelligence: provides rigorous role requirement matrices", () => {
    const aiReqs = getRoleRequirements("AI Engineer");
    assert.ok(aiReqs.length >= 6);
    assert.ok(aiReqs.some((r) => r.skill === "Python" && r.priority === "Core Requirement"));
    assert.ok(aiReqs.some((r) => r.skill.includes("Machine Learning")));

    const fsReqs = getRoleRequirements("Full Stack Engineer");
    assert.ok(fsReqs.some((r) => r.skill.includes("React") || r.skill.includes("Frontend")));
    assert.ok(fsReqs.some((r) => r.skill.includes("Databases")));
});

test("Platform URL parser: extracts clean handles and detects platforms from links or emails", () => {
    // 1. Full GitHub profile link
    const gh = sanitizePlatformAndHandle("github", "https://github.com/aadityaraj1325/");
    assert.equal(gh.platform, "github");
    assert.equal(gh.handle, "aadityaraj1325");
    assert.equal(generateProfileUrl(gh.platform, gh.handle), "https://github.com/aadityaraj1325");

    // 2. LeetCode profile link with /u/
    const lc = sanitizePlatformAndHandle("leetcode", "https://leetcode.com/u/neetcode_fan");
    assert.equal(lc.platform, "leetcode");
    assert.equal(lc.handle, "neetcode_fan");

    // 3. Codeforces profile link
    const cf = sanitizePlatformAndHandle("codeforces", "https://codeforces.com/profile/tourist");
    assert.equal(cf.platform, "codeforces");
    assert.equal(cf.handle, "tourist");

    // 4. Handle with leading @
    const at = sanitizePlatformAndHandle("github", "@torvalds");
    assert.equal(at.handle, "torvalds");

    // 5. Email entered by mistake (e.g. adityaraj12513@gmail.com)
    const email = sanitizePlatformAndHandle("github", "adityaraj12513@gmail.com");
    assert.equal(email.handle, "adityaraj12513");
    assert.equal(email.wasEmail, true);

    // 6. Bare platform domain without username
    const bareGh = sanitizePlatformAndHandle("github", "https://github.com/");
    assert.equal(bareGh.handle, "");

    const bareLc = sanitizePlatformAndHandle("leetcode", "https://leetcode.com");
    assert.equal(bareLc.handle, "");
});

test("GitHub integration: normalizes new repository creation into repo_created activity", () => {
    const fakeRepo = {
        id: 998877,
        name: "demo",
        fullName: "aadityaraj1325/demo",
        ownerLogin: "aadityaraj1325",
        description: "Test demonstration repository",
        htmlUrl: "https://github.com/aadityaraj1325/demo",
        language: "JavaScript",
        stars: 3,
        createdAt: new Date("2026-10-31T18:00:00Z"),
    };

    const activity = normalizeRepoCreatedActivity(fakeRepo, "user123");
    assert.equal(activity.platform, "github");
    assert.equal(activity.activityType, "repo_created");
    assert.equal(activity.title, "Created repository demo");
    assert.equal(activity.externalId, "gh_repo_created_998877");
    assert.equal(activity.activityDate, "2026-10-31");
    assert.ok(activity.skillTags.includes("JavaScript"));
});

test("GitHub integration: normalizes direct repository commits into verified commit activities", () => {
    const fakeCommits = [
        {
            sha: "abc123def456",
            message: "Initial commit on demo repo",
            fullMessage: "Initial commit on demo repo\n\nSetup project structure",
            date: "2026-10-31T19:30:00Z",
            htmlUrl: "https://github.com/aadityaraj1325/demo/commit/abc123def456",
            authorLogin: "aadityaraj1325",
        },
    ];

    const activities = normalizeRepoCommits(fakeCommits, "demo", "aadityaraj1325", "user123");
    assert.equal(activities.length, 1);
    const act = activities[0];
    assert.equal(act.platform, "github");
    assert.equal(act.activityType, "commit");
    assert.equal(act.externalId, "gh_commit_abc123def456");
    assert.equal(act.title, "Commit to demo: Initial commit on demo repo");
    assert.equal(act.activityDate, "2026-10-31");
    assert.equal(act.metadata.sha, "abc123def456");
});

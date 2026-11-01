/**
 * GitHub Integration Service
 * Interacts with GitHub REST API and GraphQL to retrieve real profile data,
 * repositories, commits, public events, contribution calendar, and rate limit statistics.
 */

const GITHUB_API_BASE = "https://api.github.com";

/**
 * Common request headers for GitHub API
 */
function getHeaders(token) {
    const headers = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "HireSense-AI-Developer-Tracker",
    };
    if (token) {
        const cleanToken = String(token).trim().replace(/^Bearer\s+/i, "").replace(/^token\s+/i, "");
        if (cleanToken) {
            headers.Authorization = `Bearer ${cleanToken}`;
        }
    }
    return headers;
}

/**
 * Fetch GitHub user public profile
 * Resilient against invalid/expired tokens (falls back cleanly to public endpoint)
 */
async function fetchUserProfile(username, token = null) {
    const url = `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}`;
    let res = await fetch(url, { headers: getHeaders(token) });
    let tokenWarning = null;
    let tokenStatus = "none";

    // Resilient 401 fallback: If token was rejected by GitHub, retry unauthenticated
    if (res.status === 401 && token) {
        tokenStatus = "invalid_or_expired";
        tokenWarning =
            "The entered Personal Access Token was rejected by GitHub (401 Bad credentials / expired). Successfully retrieved public profile without the token.";
        res = await fetch(url, { headers: getHeaders(null) });
    } else if (token && res.ok) {
        tokenStatus = "valid";
    }

    if (!res.ok) {
        if (res.status === 404) {
            throw new Error(`GitHub user "${username}" was not found.`);
        }
        if (res.status === 403) {
            const limit = res.headers.get("x-ratelimit-remaining");
            if (limit === "0") {
                throw new Error("GitHub API rate limit exceeded. Please provide a Personal Access Token or try again later.");
            }
        }
        throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return {
        username: data.login,
        name: data.name || data.login,
        avatarUrl: data.avatar_url,
        bio: data.bio || "",
        publicRepos: data.public_repos || 0,
        followers: data.followers || 0,
        following: data.following || 0,
        createdAt: data.created_at,
        htmlUrl: data.html_url,
        tokenStatus,
        tokenWarning,
        tokenValid: tokenStatus === "valid",
    };
}

/**
 * Fetch repositories for a user with pagination support
 * Resilient against 401 token rejections
 */
async function fetchUserRepos(username, token = null, maxRepos = 100) {
    const allRepos = [];
    let page = 1;
    const perPage = Math.min(maxRepos, 100);

    while (allRepos.length < maxRepos) {
        const url = `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/repos?sort=updated&direction=desc&per_page=${perPage}&page=${page}&type=owner`;
        let res = await fetch(url, { headers: getHeaders(token) });

        if (res.status === 401 && token) {
            // Token was invalid, fallback to unauthenticated public repos
            res = await fetch(url, { headers: getHeaders(null) });
        }

        if (!res.ok) {
            if (res.status === 404) break;
            if (allRepos.length > 0) break; // Return what we got so far
            throw new Error(`Failed to fetch repositories for GitHub user "${username}". Status: ${res.status}`);
        }

        const repos = await res.json();
        if (!Array.isArray(repos) || repos.length === 0) break;

        for (const repo of repos) {
            allRepos.push({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                ownerLogin: repo.owner?.login || username,
                description: repo.description || "",
                htmlUrl: repo.html_url,
                visibility: repo.visibility || (repo.private ? "private" : "public"),
                defaultBranch: repo.default_branch || "main",
                language: repo.language || null,
                stars: repo.stargazers_count || 0,
                forks: repo.forks_count || 0,
                openIssuesCount: repo.open_issues_count || 0,
                updatedAt: new Date(repo.updated_at),
                createdAt: new Date(repo.created_at),
                pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
                isFork: Boolean(repo.fork),
                isArchived: Boolean(repo.archived),
                topics: Array.isArray(repo.topics) ? repo.topics : [],
            });
            if (allRepos.length >= maxRepos) break;
        }

        if (repos.length < perPage) break; // No more pages
        page++;
        if (page > 5) break; // Guard against infinite loop
    }

    return allRepos;
}

/**
 * Fetch commits for a specific repository authored by user
 */
async function fetchRepoCommits(owner, repo, author, token = null, maxCommits = 15) {
    try {
        const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?author=${encodeURIComponent(author)}&per_page=${maxCommits}`;
        let res = await fetch(url, { headers: getHeaders(token) });

        if (res.status === 401 && token) {
            res = await fetch(url, { headers: getHeaders(null) });
        }

        if (!res.ok) return [];

        const commits = await res.json();
        if (!Array.isArray(commits)) return [];

        return commits.map((c) => ({
            sha: c.sha,
            message: c.commit?.message ? c.commit.message.split("\n")[0] : `Commit to ${repo}`,
            fullMessage: c.commit?.message || "",
            date: c.commit?.author?.date || c.commit?.committer?.date || new Date().toISOString(),
            htmlUrl: c.html_url || `https://github.com/${owner}/${repo}/commit/${c.sha}`,
            authorLogin: c.author?.login || author,
        }));
    } catch {
        return [];
    }
}

/**
 * Fetch 365-day Contribution Calendar from GitHub GraphQL or public scraper
 */
async function fetchContributionCalendar(username, token = null) {
    // 1. If valid token, use GitHub GraphQL API
    if (token) {
        try {
            const query = `
                query($username: String!) {
                    user(login: $username) {
                        contributionsCollection {
                            contributionCalendar {
                                totalContributions
                                weeks {
                                    contributionDays {
                                        contributionCount
                                        date
                                        color
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const cleanToken = String(token).trim().replace(/^Bearer\s+/i, "").replace(/^token\s+/i, "");
            const res = await fetch("https://api.github.com/graphql", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${cleanToken}`,
                    "Content-Type": "application/json",
                    "User-Agent": "HireSense-AI-Developer-Tracker",
                },
                body: JSON.stringify({ query, variables: { username } }),
            });

            if (res.ok) {
                const json = await res.json();
                const calendar = json?.data?.user?.contributionsCollection?.contributionCalendar;
                if (calendar) {
                    const days = [];
                    for (const week of calendar.weeks || []) {
                        for (const day of week.contributionDays || []) {
                            days.push({
                                date: day.date,
                                count: day.contributionCount,
                                color: day.color,
                            });
                        }
                    }
                    return {
                        totalContributions: calendar.totalContributions || 0,
                        days,
                        source: "github_graphql",
                    };
                }
            }
        } catch {
            // Fall through
        }
    }

    // 2. Fallback to public GitHub contribution proxy endpoint
    try {
        const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`);
        if (res.ok) {
            const data = await res.json();
            const days = (data.contributions || []).map((c) => ({
                date: c.date,
                count: c.count,
                level: c.level,
            }));
            const total = Object.values(data.total || {}).reduce((acc, v) => acc + (Number(v) || 0), 0);
            return {
                totalContributions: total || days.reduce((a, b) => a + b.count, 0),
                days,
                source: "public_contributions_api",
            };
        }
    } catch {
        // Fall through
    }

    return null;
}

/**
 * Fetch rate limit status for GitHub API
 */
async function fetchRateLimitStatus(token = null) {
    try {
        const url = `${GITHUB_API_BASE}/rate_limit`;
        let res = await fetch(url, { headers: getHeaders(token) });
        if (res.status === 401 && token) {
            res = await fetch(url, { headers: getHeaders(null) });
        }
        if (!res.ok) return null;

        const data = await res.json();
        const core = data?.resources?.core || {};
        return {
            limit: core.limit ?? 60,
            remaining: core.remaining ?? 60,
            reset: core.reset ? new Date(core.reset * 1000) : new Date(Date.now() + 3600000),
            used: core.used ?? 0,
        };
    } catch {
        return null;
    }
}

/**
 * Fetch recent public activity/events for a user
 * Resilient against 401 token rejections
 */
async function fetchUserEvents(username, token = null, maxEvents = 50) {
    const url = `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/events/public?per_page=${maxEvents}`;
    let res = await fetch(url, { headers: getHeaders(token) });

    if (res.status === 401 && token) {
        // Fallback to unauthenticated public events
        res = await fetch(url, { headers: getHeaders(null) });
    }

    if (!res.ok) {
        return [];
    }

    const events = await res.json();
    if (!Array.isArray(events)) return [];

    return events;
}

/**
 * Parse GitHub events into normalized PlatformActivity items
 */
function normalizeGitHubEvents(events, username, userId) {
    const activities = [];
    const seenIds = new Set();

    for (const ev of events) {
        if (!ev || !ev.id || seenIds.has(ev.id)) continue;
        seenIds.add(ev.id);

        const date = new Date(ev.created_at);
        const activityDate = date.toISOString().slice(0, 10);
        const repoName = ev.repo?.name || "unknown-repo";
        const repoUrl = `https://github.com/${repoName}`;

        if (ev.type === "PushEvent") {
            const commits = ev.payload?.commits || [];
            const commitCount = commits.length || 1;
            const topMsg = commits[0]?.message ? commits[0].message.split("\n")[0] : `Pushed to ${repoName}`;

            activities.push({
                userId,
                platform: "github",
                externalId: `gh_push_${ev.id}`,
                activityType: "commit",
                title: `${commitCount} commit${commitCount > 1 ? "s" : ""} to ${repoName}`,
                description: topMsg,
                sourceUrl: repoUrl,
                timestamp: date,
                activityDate,
                metadata: {
                    repoName,
                    commitCount,
                    ref: ev.payload?.ref || "main",
                },
                skillTags: ["Git", "GitHub"],
                isManual: false,
                verified: true,
                verificationLevel: 2,
            });
        } else if (ev.type === "CreateEvent" && (ev.payload?.ref_type === "repository" || !ev.payload?.ref_type)) {
            activities.push({
                userId,
                platform: "github",
                externalId: `gh_repo_event_${ev.id}`,
                activityType: "repo_created",
                title: `Created repository ${repoName}`,
                description: `Created new repository ${repoName}`,
                sourceUrl: repoUrl,
                timestamp: date,
                activityDate,
                metadata: { repoName },
                skillTags: ["Git", "GitHub"],
                isManual: false,
                verified: true,
                verificationLevel: 3,
            });
        } else if (ev.type === "PullRequestEvent") {
            const pr = ev.payload?.pull_request;
            const action = ev.payload?.action || "opened";
            activities.push({
                userId,
                platform: "github",
                externalId: `gh_pr_${ev.id}`,
                activityType: "pull_request",
                title: `PR ${action}: ${pr?.title || repoName}`,
                description: pr?.body ? pr.body.slice(0, 200) : `Pull request in ${repoName}`,
                sourceUrl: pr?.html_url || repoUrl,
                timestamp: date,
                activityDate,
                metadata: {
                    repoName,
                    action,
                    prNumber: pr?.number,
                },
                skillTags: ["Git", "GitHub", "Code Review"],
                isManual: false,
                verified: true,
                verificationLevel: 3,
            });
        }
    }

    return activities;
}

/**
 * Normalizes direct repository commits into PlatformActivity
 */
function normalizeRepoCommits(commits, repoName, ownerLogin, userId) {
    const activities = [];
    for (const c of commits) {
        if (!c || !c.sha) continue;
        const commitDate = new Date(c.date);
        const activityDate = commitDate.toISOString().slice(0, 10);
        activities.push({
            userId,
            platform: "github",
            externalId: `gh_commit_${c.sha}`,
            activityType: "commit",
            title: `Commit to ${repoName}: ${c.message}`,
            description: c.fullMessage || c.message,
            sourceUrl: c.htmlUrl,
            timestamp: commitDate,
            activityDate,
            metadata: {
                repoName,
                sha: c.sha,
                commitCount: 1,
            },
            skillTags: ["Git", "GitHub"],
            isManual: false,
            verified: true,
            verificationLevel: 3,
        });
    }
    return activities;
}

/**
 * Normalizes repository creation into PlatformActivity
 */
function normalizeRepoCreatedActivity(repo, userId) {
    const createdDate = new Date(repo.createdAt || Date.now());
    const activityDate = createdDate.toISOString().slice(0, 10);
    return {
        userId,
        platform: "github",
        externalId: `gh_repo_created_${repo.id || repo.githubRepoId}`,
        activityType: "repo_created",
        title: `Created repository ${repo.name}`,
        description: repo.description ? `${repo.description} (Language: ${repo.language || "General"})` : `Created repository ${repo.name}`,
        sourceUrl: repo.htmlUrl,
        timestamp: createdDate,
        activityDate,
        metadata: {
            repoName: repo.name,
            stars: repo.stars || 0,
            language: repo.language,
        },
        skillTags: ["Git", "GitHub", repo.language || "Software Engineering"],
        isManual: false,
        verified: true,
        verificationLevel: 3,
    };
}

/**
 * Aggregates language distribution and stars from repos
 */
function aggregateGitHubRepoStats(repos) {
    const languageCounts = {};
    let totalStars = 0;
    let totalForks = 0;

    for (const repo of repos) {
        if (!repo.isFork) {
            totalStars += repo.stars || 0;
            totalForks += repo.forks || 0;
            if (repo.language) {
                languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
            }
        }
    }

    const languageDistribution = Object.entries(languageCounts)
        .map(([language, count]) => ({ language, count }))
        .sort((a, b) => b.count - a.count);

    return {
        totalStars,
        totalForks,
        languageDistribution,
        repoCount: repos.length,
    };
}

module.exports = {
    fetchUserProfile,
    fetchUserRepos,
    fetchRepoCommits,
    fetchContributionCalendar,
    fetchRateLimitStatus,
    fetchUserEvents,
    normalizeGitHubEvents,
    normalizeRepoCommits,
    normalizeRepoCreatedActivity,
    aggregateGitHubRepoStats,
};

/**
 * Platform URL and Handle Parser Utility
 * Extracts clean platform handles from full URLs, short URLs, handles, or emails.
 */

/**
 * Platform URL and Handle Parser Utility
 * Extracts clean platform handles from full URLs, short URLs, handles, or emails.
 */

const KNOWN_DOMAINS = new Set([
    "github.com",
    "leetcode.com",
    "codeforces.com",
    "hackerrank.com",
    "codechef.com",
    "geeksforgeeks.org",
    "atcoder.jp",
    "kaggle.com",
]);

function sanitizePlatformAndHandle(inputPlatform, rawInput) {
    let clean = String(rawInput || "").trim();
    if (!clean) return { platform: inputPlatform || "github", handle: "", wasEmail: false };

    let wasEmail = false;
    if (clean.includes("@") && clean.includes(".") && !clean.includes("/")) {
        wasEmail = true;
        clean = clean.split("@")[0];
    }

    // Strip leading @, protocols, and trailing slashes
    clean = clean.replace(/^@+/, "").replace(/\/+$/, "");

    let detectedPlatform = inputPlatform || "github";

    // Detect if rawInput is a full or partial URL
    if (/github\.com/i.test(clean)) {
        detectedPlatform = "github";
        // Extract username: match github.com/username (ignoring subpaths or query strings)
        const match = clean.match(/github\.com\/([a-zA-Z0-9\-_]+)/i);
        clean = match ? match[1] : "";
    } else if (/leetcode\.com/i.test(clean)) {
        detectedPlatform = "leetcode";
        const match = clean.match(/leetcode\.com\/(?:u\/)?([a-zA-Z0-9\-_]+)/i);
        clean = match ? match[1] : "";
    } else if (/codeforces\.com/i.test(clean)) {
        detectedPlatform = "codeforces";
        const match = clean.match(/codeforces\.com\/(?:profile\/)?([a-zA-Z0-9\-_]+)/i);
        clean = match ? match[1] : "";
    } else if (/hackerrank\.com/i.test(clean)) {
        detectedPlatform = "hackerrank";
        const match = clean.match(/hackerrank\.com\/(?:profile\/)?([a-zA-Z0-9\-_]+)/i);
        clean = match ? match[1] : "";
    } else if (/codechef\.com/i.test(clean)) {
        detectedPlatform = "codechef";
        const match = clean.match(/codechef\.com\/(?:users\/)?([a-zA-Z0-9\-_]+)/i);
        clean = match ? match[1] : "";
    } else if (/geeksforgeeks\.org/i.test(clean)) {
        detectedPlatform = "geeksforgeeks";
        const match = clean.match(/(?:user|profile)\/([a-zA-Z0-9\-_]+)/i);
        clean = match ? match[1] : "";
    } else if (/atcoder\.jp/i.test(clean)) {
        detectedPlatform = "atcoder";
        const match = clean.match(/atcoder\.jp\/(?:users\/)?([a-zA-Z0-9\-_]+)/i);
        clean = match ? match[1] : "";
    } else if (/kaggle\.com/i.test(clean)) {
        detectedPlatform = "kaggle";
        const match = clean.match(/kaggle\.com\/([a-zA-Z0-9\-_]+)/i);
        clean = match ? match[1] : "";
    } else {
        // Strip any remaining query string or path segment
        clean = clean.split(/[?#]/)[0].split("/").filter(Boolean).pop() || clean;
        clean = clean.replace(/^@+/, "");
    }

    clean = clean.trim();

    // If clean matches a bare domain or empty, reset to empty handle
    if (KNOWN_DOMAINS.has(clean.toLowerCase()) || clean.toLowerCase() === "http:" || clean.toLowerCase() === "https:") {
        clean = "";
    }

    return {
        platform: detectedPlatform,
        handle: clean,
        wasEmail,
    };
}

function generateProfileUrl(platform, handle) {
    if (!handle) return "";
    switch (platform) {
        case "github":
            return `https://github.com/${handle}`;
        case "leetcode":
            return `https://leetcode.com/${handle}/`;
        case "codeforces":
            return `https://codeforces.com/profile/${handle}`;
        case "hackerrank":
            return `https://www.hackerrank.com/profile/${handle}`;
        case "codechef":
            return `https://www.codechef.com/users/${handle}`;
        case "geeksforgeeks":
            return `https://auth.geeksforgeeks.org/user/${handle}/practice/`;
        case "atcoder":
            return `https://atcoder.jp/users/${handle}`;
        case "kaggle":
            return `https://www.kaggle.com/${handle}`;
        default:
            return "";
    }
}

module.exports = {
    sanitizePlatformAndHandle,
    generateProfileUrl,
};


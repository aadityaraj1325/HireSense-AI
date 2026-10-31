const { GoogleGenAI, Type } = require("@google/genai");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

const ai = env.geminiApiKey ? new GoogleGenAI({ apiKey: env.geminiApiKey }) : null;

const linkSchema = {
    type: Type.OBJECT,
    required: ["label", "url"],
    properties: {
        label: { type: Type.STRING },
        url: { type: Type.STRING },
    },
};

const responseSchema = {
    type: Type.OBJECT,
    required: [
        "basics",
        "summary",
        "experience",
        "education",
        "skills",
        "projects",
        "certifications",
        "languages",
        "interests",
    ],
    properties: {
        basics: {
            type: Type.OBJECT,
            required: ["name", "title", "location", "email", "phone", "links"],
            properties: {
                name: { type: Type.STRING },
                title: { type: Type.STRING },
                location: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                links: { type: Type.ARRAY, items: linkSchema },
            },
        },
        summary: { type: Type.STRING },
        experience: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                required: ["company", "role", "location", "period", "bullets"],
                properties: {
                    company: { type: Type.STRING },
                    role: { type: Type.STRING },
                    location: { type: Type.STRING },
                    period: { type: Type.STRING },
                    bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
            },
        },
        education: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                required: ["institution", "degree", "fieldOfStudy", "location", "period", "bullets"],
                properties: {
                    institution: { type: Type.STRING },
                    degree: { type: Type.STRING },
                    fieldOfStudy: { type: Type.STRING },
                    location: { type: Type.STRING },
                    period: { type: Type.STRING },
                    bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
            },
        },
        skills: { type: Type.ARRAY, items: { type: Type.STRING } },
        projects: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                required: ["name", "description", "tech", "links"],
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    tech: { type: Type.ARRAY, items: { type: Type.STRING } },
                    links: { type: Type.ARRAY, items: linkSchema },
                },
            },
        },
        certifications: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                required: ["name", "issuer", "date"],
                properties: {
                    name: { type: Type.STRING },
                    issuer: { type: Type.STRING },
                    date: { type: Type.STRING },
                },
            },
        },
        languages: { type: Type.ARRAY, items: { type: Type.STRING } },
        interests: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
};

const { z } = require("zod");

const validator = z.object({
    basics: z.object({
        name: z.string().default(""),
        title: z.string().default(""),
        location: z.string().default(""),
        email: z.string().default(""),
        phone: z.string().default(""),
        links: z.array(z.object({ label: z.string().default(""), url: z.string().default("") })).default([]),
    }).default({}),

    summary: z.string().default(""),

    experience: z.array(
        z.object({
            company: z.string().default(""),
            role: z.string().default(""),
            location: z.string().default(""),
            period: z.string().default(""),
            bullets: z.array(z.string()).default([]),
        })
    ).default([]),

    education: z.array(
        z.object({
            institution: z.string().default(""),
            degree: z.string().default(""),
            fieldOfStudy: z.string().default(""),
            location: z.string().default(""),
            period: z.string().default(""),
            bullets: z.array(z.string()).default([]),
        })
    ).default([]),

    skills: z.array(z.string()).default([]),

    projects: z.array(
        z.object({
            name: z.string().default(""),
            description: z.string().default(""),
            tech: z.array(z.string()).default([]),
            links: z.array(z.object({ label: z.string().default(""), url: z.string().default("") })).default([]),
        })
    ).default([]),

    certifications: z.array(
        z.object({
            name: z.string().default(""),
            issuer: z.string().default(""),
            date: z.string().default(""),
        })
    ).default([]),

    languages: z.array(z.string()).default([]),
    interests: z.array(z.string()).default([]),
});

function buildPrompt(rawText) {
    return [
        "You are a resume parser. The input is text extracted from a PDF - lines may be jumbled or out of natural reading order.",
        "",
        "Extract structured data:",
        '- basics: name, professional title, location, email, phone, social links (LinkedIn / GitHub / portfolio etc.; label like "LinkedIn", full URL)',
        "- summary: single professional summary paragraph (rejoin if split across lines)",
        "- experience: jobs most recent first, with company, role, period (preserve original date format), location if available, and bullet points",
        "- education: degree, school, period, location, optional details",
        "- skills: flat array of technical skills",
        "- projects: name, one-sentence description, optional tech tags, optional links",
        "- certifications: name, issuer, year/date",
        "- languages: flat array",
        "- interests: flat array",
        "",
        "RULES:",
        "- Be conservative: omit fields that are not clearly present. Use empty strings/arrays where missing.",
        "- Do not invent or paraphrase - extract verbatim where possible.",
        "- Each experience bullet should read as a complete sentence.",
        "- Preserve original date formats (e.g. 'Jan 2022 - Dec 2023').",
        "",
        "RESUME TEXT:",
        rawText,
        "------------",
    ].join("\n");
}


const EMPTY = {
    basics: { name: "", title: "", location: "", email: "", phone: "", links: [] },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    interests: [],
};

const SECTION_ALIASES = [
    ["summary", /^(professional\s+summary|summary|profile|career\s+objective|objective)$/i],
    ["skills", /^(technical\s+skills?|skills?|core\s+competencies|soft\s+skills?)$/i],
    ["experience", /^(work\s+experience|professional\s+experience|experience|employment\s+history|internships?)$/i],
    ["projects", /^(projects?|academic\s+projects?|personal\s+projects?)$/i],
    ["education", /^(education|academic\s+background|qualifications?)$/i],
    ["certifications", /^(certifications?|licenses?)$/i],
    ["languages", /^(languages?)$/i],
    ["interests", /^(interests?|hobbies?)$/i],
];

function cleanHeading(line) {
    return line.replace(/^[\s#\-:|]+|[\s:|]+$/g, "").trim();
}

function isHeading(line) {
    const heading = cleanHeading(line);
    return SECTION_ALIASES.find(([, pattern]) => pattern.test(heading));
}

function parseFallback(rawText) {
    const result = JSON.parse(JSON.stringify(EMPTY));
    const lines = String(rawText || "")
        .replace(/\r\n?/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    if (!lines.length) return result;

    const first = lines[0];
    if (!isHeading(first) && first.length < 80) {
        result.basics.name = first;
        const second = lines[1];
        if (second && !isHeading(second) && second.length < 100) {
            result.basics.title = second;
        }
    }

    let active = null;
    const buckets = new Map();
    for (const line of lines) {
        const heading = isHeading(line);
        if (heading) {
            active = heading[0];
            buckets.set(active, []);
            continue;
        }
        if (active) buckets.get(active).push(line);
    }

    const body = (key) => buckets.get(key) || [];
    result.summary = body("summary").join(" ");
    result.skills = body("skills")
        .join(",")
        .split(/[,;|•]/)
        .map((item) => item.replace(/^[\s\-*]+/, "").trim())
        .filter(Boolean);
    result.languages = body("languages").join(",").split(/[,;|•]/).map((item) => item.trim()).filter(Boolean);
    result.interests = body("interests").join(",").split(/[,;|•]/).map((item) => item.trim()).filter(Boolean);
    result.certifications = body("certifications").map((name) => ({ name, issuer: "", date: "" }));
    result.education = body("education").map((line) => ({
        institution: line,
        degree: "",
        fieldOfStudy: "",
        location: "",
        period: "",
        bullets: [],
    }));
    result.projects = body("projects").map((line) => ({
        name: line.replace(/^[\s\-*•]+/, "").slice(0, 100),
        description: line,
        tech: [],
        links: [],
    }));
    result.experience = body("experience").map((line) => ({
        company: "",
        role: "",
        location: "",
        period: "",
        bullets: [line.replace(/^[\s\-*•]+/, "")],
    }));
    return result;
}

function hasStructuredContent(parsed) {
    return Boolean(
        parsed?.basics?.name ||
        parsed?.basics?.title ||
        parsed?.summary ||
        parsed?.experience?.length ||
        parsed?.education?.length ||
        parsed?.skills?.length ||
        parsed?.projects?.length ||
        parsed?.certifications?.length ||
        parsed?.languages?.length ||
        parsed?.interests?.length
    );
}

async function parseResume(rawText) {
    if (!rawText?.trim()) return EMPTY;
    if (!ai) return parseFallback(rawText);

    const prompt = buildPrompt(rawText);

    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const result = await ai.models.generateContent({
                model: env.geminiModel,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema,
                    temperature: 0.1,
                },
            });

            const text = typeof result.text === "function" ? result.text() : result.text;
            if (!text) throw new Error("Empty response");

            const parsed = JSON.parse(text);
            const validated = validator.parse(parsed);
            return hasStructuredContent(validated) ? validated : parseFallback(rawText);
        } catch (err) {
            if (attempt === 2) {
                console.error("Structured parse failed; using deterministic fallback:", err.message);
                return parseFallback(rawText);
            }
        }
    }

    return parseFallback(rawText);
}

module.exports = { parseResume, parseFallback, EMPTY, hasStructuredContent };
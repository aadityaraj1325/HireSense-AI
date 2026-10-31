const RUBRIC_VERSION = "job-compatibility-v1";

const WEIGHTS = {
    keywordMatching: 35,
    experienceRelevance: 25,
    projectRelevance: 20,
    educationCertifications: 10,
    structure: 10,
};

const SYNONYMS = new Map([
    ["react", ["react.js", "reactjs"]],
    ["node.js", ["node", "nodejs"]],
    ["javascript", ["js", "ecmascript"]],
    ["typescript", ["ts"]],
    ["rest api", ["restful api", "rest apis", "restful endpoints"]],
    ["machine learning", ["ml"]],
    ["artificial intelligence", ["ai"]],
    ["amazon web services", ["aws"]],
    ["continuous integration", ["ci"]],
    ["continuous delivery", ["cd"]],
]);

function normalize(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^\w+#./ -]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function unique(values) {
    return [...new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean))];
}

function resumeEvidence(parsedSections, rawText) {
    const sections = [
        ["summary", parsedSections?.summary],
        ["skills", (parsedSections?.skills || []).join(" ")],
        ["experience", (parsedSections?.experience || []).flatMap((item) => [item.role, item.company, ...(item.bullets || [])]).join(" ")],
        ["projects", (parsedSections?.projects || []).flatMap((item) => [item.name, item.description, ...(item.tech || [])]).join(" ")],
        ["education", (parsedSections?.education || []).flatMap((item) => [item.degree, item.fieldOfStudy, item.institution, ...(item.bullets || [])]).join(" ")],
        ["certifications", (parsedSections?.certifications || []).flatMap((item) => [item.name, item.issuer]).join(" ")],
    ].filter(([, value]) => value);

    return sections.length ? sections : [["resume", rawText || ""]];
}

function findEvidence(requirement, sections) {
    const target = normalize(requirement);
    if (!target) return null;
    const variants = [target, ...(SYNONYMS.get(target) || [])];
    for (const [section, text] of sections) {
        const normalized = normalize(text);
        const variant = variants.find((candidate) => normalized.includes(normalize(candidate)));
        if (variant) {
            return { section, evidence: text.slice(0, 220), matchedTerm: variant };
        }
    }
    return null;
}

function findJobEvidence(requirement, jobDescription) {
    const target = normalize(requirement);
    if (!target || !jobDescription) return null;
    const sentences = String(jobDescription)
        .split(/(?<=[.!?])\s+|\r?\n/)
        .map((sentence) => sentence.trim())
        .filter(Boolean);
    const variants = [target, ...(SYNONYMS.get(target) || [])];
    return sentences.find((sentence) =>
        variants.some((variant) => normalize(sentence).includes(normalize(variant)))
    )?.slice(0, 280) || null;
}

function classifyRequirement(requirement, sections, jobDescription, category) {
    const evidence = findEvidence(requirement, sections);
    if (!evidence) {
        return {
            category,
            matchType: "Missing",
            evidence: null,
            section: null,
            jobEvidence: findJobEvidence(requirement, jobDescription),
            confidence: 0.98,
        };
    }
    const exact = new RegExp(`(^| )${normalize(requirement).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($| )`).test(
        normalize(evidence.evidence)
    );
    return {
        category,
        matchType: exact ? "Exact Match" : "Synonym Match",
        evidence: evidence.evidence,
        section: evidence.section,
        matchedTerm: evidence.matchedTerm,
        jobEvidence: findJobEvidence(requirement, jobDescription),
        confidence: exact ? 0.99 : 0.9,
    };
}

function scoreGroup(matches, maxPoints) {
    if (!matches.length) return 0;
    const points = matches.reduce((sum, item) => {
        if (item.matchType === "Exact Match") return sum + 1;
        if (item.matchType === "Synonym Match") return sum + 0.9;
        if (item.matchType === "Semantic Match") return sum + 0.8;
        if (item.matchType === "Partially Matched") return sum + 0.5;
        return sum;
    }, 0);
    return Math.round((points / matches.length) * maxPoints);
}

function calculateCompatibility({ parsedSections, rawText, jobRequirements, jobDescription = "" }) {
    const sections = resumeEvidence(parsedSections, rawText);
    const required = unique([
        ...(jobRequirements?.mandatorySkills || []),
        ...(jobRequirements?.technicalRequirements || []),
        ...(jobRequirements?.certifications || []),
    ]);
    const preferred = unique([
        ...(jobRequirements?.preferredSkills || []),
        ...(jobRequirements?.keywords || []),
    ]).filter((item) => !required.some((value) => normalize(value) === normalize(item)));

    const requiredMatches = required.map((requirement) => ({
        requirement,
        priority: "mandatory",
        ...classifyRequirement(requirement, sections, jobDescription, "skill"),
    }));
    const preferredMatches = preferred.map((requirement) => ({
        requirement,
        priority: "preferred",
        ...classifyRequirement(requirement, sections, jobDescription, "keyword"),
    }));
    const matches = [...requiredMatches, ...preferredMatches];

    const keywordScore = scoreGroup(requiredMatches, 28) + scoreGroup(preferredMatches, 7);
    const experienceMatches = [...(jobRequirements?.experienceRequirements || [])].map((requirement) => ({
        requirement,
        ...classifyRequirement(requirement, sections, jobDescription, "experience"),
    }));
    const projectMatches = [...(jobRequirements?.responsibilities || [])].map((requirement) => ({
        requirement,
        ...classifyRequirement(requirement, sections, jobDescription, "responsibility"),
    }));
    const educationMatches = [...(jobRequirements?.educationRequirements || []), ...(jobRequirements?.certifications || [])].map((requirement) => ({
        requirement,
        ...classifyRequirement(requirement, sections, jobDescription, "education"),
    }));
    const breakdown = {
        keywordMatching: keywordScore,
        experienceRelevance: scoreGroup(experienceMatches, WEIGHTS.experienceRelevance),
        projectRelevance: scoreGroup(projectMatches, WEIGHTS.projectRelevance),
        educationCertifications: scoreGroup(educationMatches, WEIGHTS.educationCertifications),
        structure: Math.round(Math.min(1, sections.length / 6) * WEIGHTS.structure),
    };
    const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

    const recommendations = matches
        .filter((match) => match.matchType === "Missing" || match.matchType === "Partially Matched")
        .map((match) => ({
            priority: match.priority === "mandatory" ? "critical" : "high",
            requirement: match.requirement,
            whyItMatters: match.priority === "mandatory"
                ? "This requirement was identified as mandatory in the target job description."
                : "This preferred requirement can improve relevance for the target role.",
            currentSection: match.section || "Not found",
            currentSentence: match.evidence || "",
            suggestedReplacement: "",
            action: match.matchType === "Missing"
                ? `Verify whether you have genuine experience with ${match.requirement}. If yes, add it to the most relevant section and describe how you used it.`
                : `Strengthen the ${match.section || "relevant"} evidence for ${match.requirement} with a specific, truthful example.`,
            requiresConfirmation: true,
        }));

    return {
        rubricVersion: RUBRIC_VERSION,
        weights: WEIGHTS,
        jobRequirements,
        score: total,
        breakdown,
        keywordMatches: matches,
        missingRequirements: matches.filter((match) => match.matchType === "Missing").map((match) => match.requirement),
        recommendations,
    };
}

module.exports = { RUBRIC_VERSION, WEIGHTS, calculateCompatibility };

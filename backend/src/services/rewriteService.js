const crypto = require("crypto");
const ApiError = require("../utils/ApiError");

function normalizeText(value) {
    return String(value || "")
        .normalize("NFKC")
        .replace(/\u00a0/g, " ")
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201c\u201d]/g, '"')
        .replace(/[\u2013\u2014]/g, "-")
        .replace(/\r\n?/g, "\n")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function fingerprint(value) {
    return crypto.createHash("sha256").update(normalizeText(value)).digest("hex");
}

function structuredCandidates(sections) {
    const candidates = [];
    const add = (section, fieldPath, value) => {
        if (typeof value === "string" && value.trim()) {
            candidates.push({ section, fieldPath, value });
        }
    };
    add("summary", "summary", sections?.summary);
    (sections?.skills || []).forEach((value, index) => add("skills", `skills[${index}]`, value));
    (sections?.experience || []).forEach((item, index) => {
        add("experience", `experience[${index}].role`, item.role);
        (item.bullets || []).forEach((value, bulletIndex) =>
            add("experience", `experience[${index}].bullets[${bulletIndex}]`, value)
        );
    });
    (sections?.projects || []).forEach((item, index) => {
        add("projects", `projects[${index}].name`, item.name);
        add("projects", `projects[${index}].description`, item.description);
        (item.tech || []).forEach((value, techIndex) =>
            add("projects", `projects[${index}].tech[${techIndex}]`, value)
        );
    });
    (sections?.education || []).forEach((item, index) => {
        add("education", `education[${index}].degree`, item.degree);
        add("education", `education[${index}].fieldOfStudy`, item.fieldOfStudy);
        (item.bullets || []).forEach((value, bulletIndex) =>
            add("education", `education[${index}].bullets[${bulletIndex}]`, value)
        );
    });
    (sections?.certifications || []).forEach((item, index) =>
        add("certifications", `certifications[${index}].name`, item.name)
    );
    return candidates;
}

function sectionMatches(candidate, requestedSection) {
    if (!requestedSection) return true;
    const requested = normalizeText(requestedSection);
    const aliases = { project: "projects", experience: "experience", work: "experience", education: "education", skill: "skills", certification: "certifications" };
    const normalizedSection = aliases[requested] || requested;
    return candidate.section === normalizedSection ||
        candidate.fieldPath.toLowerCase().startsWith(`${normalizedSection}[`) ||
        candidate.fieldPath.toLowerCase().startsWith(`${normalizedSection}.`);
}

function locateRewrite(rewrite, sections) {
    const original = normalizeText(rewrite.original);
    if (!original) return null;
    const candidates = structuredCandidates(sections).filter((candidate) =>
        sectionMatches(candidate, rewrite.section)
    );
    if (rewrite.fieldPath) {
        const anchored = candidates.filter((candidate) => candidate.fieldPath === rewrite.fieldPath);
        if (anchored.length === 1) {
            const value = normalizeText(anchored[0].value);
            if (value === original || (original.length >= 40 && value.startsWith(original))) {
                return {
                    ...anchored[0],
                    matchType: value === original ? "exact-anchor" : "anchored-prefix",
                    fingerprint: fingerprint(anchored[0].value),
                };
            }
        }
    }
    const exact = candidates.filter((candidate) => normalizeText(candidate.value) === original);
    if (exact.length === 1) return { ...exact[0], matchType: "exact", fingerprint: fingerprint(exact[0].value) };
    if (exact.length > 1) return { ambiguous: true, candidates: exact };

    // Gemini can return a shortened prefix of a long bullet. Only accept a
    // long, section-scoped prefix when it identifies one unambiguous field.
    const prefix = candidates.filter((candidate) => {
        const value = normalizeText(candidate.value);
        return original.length >= 40 && value.startsWith(original) &&
            (value.length === original.length || /[\s,.;:!?-]/.test(value[original.length]));
    });
    if (prefix.length === 1) {
        return { ...prefix[0], matchType: "anchored-prefix", fingerprint: fingerprint(prefix[0].value) };
    }
    if (prefix.length > 1) return { ambiguous: true, candidates: prefix };

    const contained = candidates.filter((candidate) =>
        original.length >= 40 && normalizeText(candidate.value).includes(original)
    );
    if (contained.length === 1) {
        return { ...contained[0], matchType: "normalized", fingerprint: fingerprint(contained[0].value) };
    }
    if (contained.length > 1) return { ambiguous: true, candidates: contained };
    return null;
}

function normalizedSpan(text, target) {
    const normalizedTarget = normalizeText(target);
    if (!normalizedTarget) return null;
    const source = String(text || "").normalize("NFKC").replace(/\u00a0/g, " ");
    let normalized = "";
    const map = [];
    let pendingSpace = false;
    for (let index = 0; index < source.length; index += 1) {
        const char = source[index];
        if (/\s/.test(char)) {
            pendingSpace = normalized.length > 0;
            continue;
        }
        if (pendingSpace) {
            normalized += " ";
            map.push(index);
            pendingSpace = false;
        }
        normalized += char.toLowerCase();
        map.push(index);
    }
    const start = normalized.indexOf(normalizedTarget);
    if (start < 0) return null;
    const end = start + normalizedTarget.length - 1;
    return { start: map[start], end: map[end] + 1 };
}

function replaceCandidate(rawText, candidate, rewritten) {
    const exactIndexes = [];
    let searchFrom = 0;
    while (true) {
        const index = rawText.indexOf(candidate.value, searchFrom);
        if (index < 0) break;
        exactIndexes.push(index);
        searchFrom = index + candidate.value.length;
    }
    let exactIndex = exactIndexes[0];
    if (exactIndexes.length > 1) {
        const heading = new RegExp(`(?:^|\\n)\\s*${candidate.section}\\s*(?:\\n|$)`, "i").exec(rawText);
        const afterHeading = heading
            ? exactIndexes.filter((index) => index >= heading.index + heading[0].length)
            : [];
        if (afterHeading.length === 1) exactIndex = afterHeading[0];
        else {
            throw ApiError.badRequest("Rewrite source matched multiple resume locations", {
                code: "AMBIGUOUS_SOURCE_MATCH",
                fieldPath: candidate.fieldPath,
                section: candidate.section,
            });
        }
    }
    if (exactIndex >= 0) {
        return rawText.slice(0, exactIndex) + rewritten + rawText.slice(exactIndex + candidate.value.length);
    }
    const span = normalizedSpan(rawText, candidate.value);
    if (!span) {
        throw ApiError.badRequest("Rewrite source text was not found", {
            code: "SOURCE_NOT_FOUND",
            fieldPath: candidate.fieldPath,
            expectedFingerprint: fingerprint(candidate.value),
        });
    }
    return rawText.slice(0, span.start) + rewritten + rawText.slice(span.end);
}

function applyRewritesToText(rawText, rewrites, sections) {
    let result = String(rawText || "");
    const usedFields = new Set();
    const applied = [];
    for (const rewrite of rewrites || []) {
        if (!rewrite?.original?.trim() || !rewrite?.rewritten?.trim()) {
            throw ApiError.badRequest("Each rewrite must include original and rewritten text.", { code: "INVALID_REWRITE_TARGET" });
        }
        const located = locateRewrite(rewrite, sections);
        if (!located) {
            throw ApiError.badRequest("Rewrite source text was not found", {
                code: "SOURCE_NOT_FOUND",
                rewriteId: rewrite._id,
                section: rewrite.section,
                expectedFingerprint: fingerprint(rewrite.original),
            });
        }
        if (located.ambiguous) {
            throw ApiError.badRequest("Rewrite source matched multiple resume fields", {
                code: "AMBIGUOUS_SOURCE_MATCH",
                rewriteId: rewrite._id,
                section: rewrite.section,
            });
        }
        if (rewrite.originalFingerprint && rewrite.originalFingerprint !== located.fingerprint) {
            throw ApiError.conflict("Resume content changed since this suggestion was generated", {
                code: "RESUME_VERSION_CONFLICT",
                rewriteId: rewrite._id,
                fieldPath: located.fieldPath,
            });
        }
        if (usedFields.has(located.fieldPath)) {
            throw ApiError.badRequest("Multiple rewrites target the same resume field", {
                code: "DUPLICATE_REWRITE",
                rewriteId: rewrite._id,
                fieldPath: located.fieldPath,
            });
        }
        result = replaceCandidate(result, located, rewrite.rewritten);
        usedFields.add(located.fieldPath);
        applied.push({ rewriteId: rewrite._id, fieldPath: located.fieldPath, matchType: located.matchType });
    }
    return { text: result, applied };
}

function patchTargetRole(sections, targetRole) {
    if (!sections || !targetRole?.trim()) return sections;
    const cloned = JSON.parse(JSON.stringify(sections));
    cloned.basics = { ...(cloned.basics || {}), title: targetRole.trim() };
    return cloned;
}

function patchBulletsInSections(sections, rewrites) {
    if (!sections) return null;
    const cloned = JSON.parse(JSON.stringify(sections));
    for (const rewrite of rewrites || []) {
        for (const section of ["experience", "education"]) {
            for (const item of cloned[section] || []) {
                if (!Array.isArray(item.bullets)) continue;
                item.bullets = item.bullets.map((bullet) =>
                    normalizeText(bullet) === normalizeText(rewrite.original) ||
                    normalizeText(bullet).startsWith(normalizeText(rewrite.original))
                        ? rewrite.rewritten
                        : bullet
                );
            }
        }
    }
    return cloned;
}

function looksEmpty(sections) {
    if (!sections) return true;
    const basics = sections.basics || {};
    return !(basics.name || basics.email || basics.title ||
        sections.summary || sections.experience?.length || sections.education?.length ||
        sections.skills?.length || sections.projects?.length);
}

module.exports = {
    normalizeText,
    fingerprint,
    structuredCandidates,
    locateRewrite,
    applyRewritesToText,
    patchTargetRole,
    patchBulletsInSections,
    looksEmpty,
};

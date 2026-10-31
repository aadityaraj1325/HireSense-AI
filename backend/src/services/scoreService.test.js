const test = require("node:test");
const assert = require("node:assert/strict");
const { clampScore, sumBreakdown } = require("./scoreService");

test("authoritative score equals the category sum and stays within 0-100", () => {
    assert.equal(sumBreakdown({ keywords: 18, formatting: 20, impact: 12, clarity: 18 }), 68);
    assert.equal(sumBreakdown({ keywordMatching: 35, experienceRelevance: 25, projectRelevance: 20, educationCertifications: 10, structure: 10 }), 100);
    assert.equal(clampScore(140), 100);
    assert.equal(clampScore(-2), 0);
});

const test = require("node:test");
const assert = require("node:assert/strict");
const { parseFallback } = require("./structuredParser");

test("fallback parser preserves real resume sections and bullets", () => {
    const parsed = parseFallback([
        "Jane Doe",
        "Frontend Engineer",
        "",
        "Professional Summary",
        "Frontend engineer building accessible products.",
        "",
        "Technical Skills",
        "React, TypeScript, Node.js",
        "",
        "Work Experience",
        "- Built a dashboard used by internal teams.",
        "",
        "Projects",
        "HireSense AI",
        "Resume intelligence platform",
        "",
        "Education",
        "B.Tech Computer Science",
    ].join("\n"));

    assert.equal(parsed.basics.name, "Jane Doe");
    assert.equal(parsed.basics.title, "Frontend Engineer");
    assert.equal(parsed.summary, "Frontend engineer building accessible products.");
    assert.deepEqual(parsed.skills, ["React", "TypeScript", "Node.js"]);
    assert.equal(parsed.experience[0].bullets[0], "Built a dashboard used by internal teams.");
    assert.equal(parsed.projects[0].name, "HireSense AI");
    assert.equal(parsed.education[0].institution, "B.Tech Computer Science");
});

test("fallback parser returns an empty structure for empty extracted text", () => {
    const parsed = parseFallback("");
    assert.deepEqual(parsed.skills, []);
    assert.deepEqual(parsed.projects, []);
    assert.equal(parsed.summary, "");
});

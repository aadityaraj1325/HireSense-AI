const test = require("node:test");
const assert = require("node:assert/strict");
const {
    normalizeText,
    locateRewrite,
    applyRewritesToText,
    patchTargetRole,
    patchBulletsInSections,
    looksEmpty,
} = require("./rewriteService");

test("applies a rewrite without changing unrelated resume text", () => {
    const result = applyRewritesToText("Name\nBuilt an app\nEducation", [
        { original: "Built an app", rewritten: "Built a React app" },
    ], { basics: { name: "Name" }, summary: "Built an app" });
    assert.equal(result.text, "Name\nBuilt a React app\nEducation");
});

test("rejects a rewrite when its source text is not present", () => {
    assert.throws(
        () => applyRewritesToText("Name", [{ original: "Missing bullet", rewritten: "New bullet" }], { basics: { name: "Name" } }),
        /Rewrite source text was not found/
    );
});

test("matches the truncated disease prediction rewrite to the complete project description", () => {
    const full = "Designed a Disease Prediction System based on Python to relate analyze symptoms and correlate them with medical conditions for early detection.";
    const sections = { projects: [{ name: "Disease Prediction", description: full, tech: ["Python"] }] };
    const rewrite = {
        section: "projects",
        original: "Designed a Disease Prediction System based on Python to relate analyze symptoms",
        rewritten: "Engineered a Python-based disease prediction system to analyze user symptoms and correlate them with medical conditions for early medical detection.",
    };
    const located = locateRewrite(rewrite, sections);
    assert.equal(located.matchType, "anchored-prefix");
    const result = applyRewritesToText(`Projects\n${full}\nOther content`, [rewrite], sections);
    assert.match(result.text, /Engineered a Python-based disease prediction system/);
    assert.doesNotMatch(result.text, /Designed a Disease Prediction System/);
    assert.match(result.text, /Other content/);
});

test("normalizes whitespace and non-breaking spaces without mutating source text", () => {
    const source = "Built\u00a0a\nReact   application";
    assert.equal(normalizeText(source), "built a react application");
    const sections = { summary: "Built a React application" };
    const result = applyRewritesToText(source, [
        { section: "summary", original: "Built a React application", rewritten: "Built a production React application" },
    ], sections);
    assert.equal(result.text, "Built a production React application");
});

test("rejects two rewrites targeting the same structured field", () => {
    const sections = { summary: "Built a React application" };
    assert.throws(
        () => applyRewritesToText("Built a React application", [
            { section: "summary", original: "Built a React application", rewritten: "Built React apps" },
            { section: "summary", original: "Built a React application", rewritten: "Built scalable React apps" },
        ], sections),
        /Multiple rewrites target the same/
    );
});

test("uses the section heading to select the correct duplicate sentence", () => {
    const sentence = "Built a shared platform for internal teams.";
    const raw = `Experience\n${sentence}\nProjects\n${sentence}`;
    const sections = {
        experience: [{ bullets: [sentence] }],
        projects: [{ description: sentence }],
    };
    const result = applyRewritesToText(raw, [
        { section: "projects", original: sentence, rewritten: "Built a shared platform for product teams." },
    ], sections);
    assert.equal(result.text, `Experience\n${sentence}\nProjects\nBuilt a shared platform for product teams.`);
});

test("patches target role at the top-level helper scope", () => {
    const sections = { basics: { name: "Candidate" }, summary: "Summary" };
    const result = patchTargetRole(sections, "Frontend Engineer");
    assert.equal(result.basics.title, "Frontend Engineer");
    assert.equal(sections.basics.title, undefined);
});

test("patches supported bullet sections and detects empty parsed content", () => {
    const sections = {
        basics: { name: "Candidate" },
        experience: [{ bullets: ["Built an app"] }],
    };
    const result = patchBulletsInSections(sections, [
        { original: "Built an app", rewritten: "Built a React app" },
    ]);
    assert.equal(result.experience[0].bullets[0], "Built a React app");
    assert.equal(looksEmpty({ basics: {}, summary: "", experience: [], skills: [] }), true);
});

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    ROLE_DEPENDENCY_TREES,
    getDependencyTreeForRole,
    buildVisualDnaGraph,
} = require("./skillDependencyDNA");

const {
    SIMULATION_ACTIONS,
} = require("./gapIntelligenceService");

test("Skill Dependency DNA: retrieves valid topological dependency tree for Full Stack Engineer", () => {
    const rawSkills = getDependencyTreeForRole("Full Stack Engineer");
    assert.ok(Array.isArray(rawSkills), "Tree should be an array of skills");
    assert.ok(rawSkills.length > 0, "Tree should have skills");

    const reactSkill = rawSkills.find((s) => s.id === "react_frontend");
    assert.ok(reactSkill, "React node should exist in Full Stack tree");
    assert.ok(reactSkill.prerequisites.includes("html_css_js"), "React must have html_css_js as prerequisite");
    assert.ok(reactSkill.level > 1, "React level should be greater than 1");
});

test("Skill Dependency DNA: builds visual graph with nodes and curved edges", () => {
    const demonstratedSkills = new Set(["html_css_js", "typescript"]);
    const graph = buildVisualDnaGraph("Full Stack Engineer", demonstratedSkills);

    assert.ok(graph.nodes && graph.nodes.length > 0, "Graph should have nodes");
    assert.ok(graph.edges && graph.edges.length > 0, "Graph should have edges");

    const jsNode = graph.nodes.find((n) => n.id === "html_css_js");
    assert.ok(jsNode, "HTML/CSS/JS node must exist in graph");
    assert.equal(jsNode.status, "demonstrated", "HTML/CSS/JS should be marked demonstrated");
    assert.ok(jsNode.position && typeof jsNode.position.x === "number", "Node must have valid X coordinate");
    assert.ok(jsNode.position && typeof jsNode.position.y === "number", "Node must have valid Y coordinate");

    const dockerNode = graph.nodes.find((n) => n.id === "docker_containerization");
    assert.ok(dockerNode, "Docker node must exist in graph");
    assert.equal(dockerNode.status, "not_yet_evidenced", "Docker should be marked not yet evidenced");

    // Check edge connection
    const edge = graph.edges.find((e) => e.source === "html_css_js" && e.target === "react_frontend");
    assert.ok(edge, "Edge into react must exist in graph");
});

test("Skill Dependency DNA: retrieves valid tree for AI Engineer with Python, ML, Deep Learning", () => {
    const rawSkills = getDependencyTreeForRole("AI Engineer");
    assert.ok(Array.isArray(rawSkills), "AI Engineer tree must be an array");
    assert.ok(rawSkills.some((s) => s.id === "python_core"), "Python core must be in AI Engineer tree");
    assert.ok(rawSkills.some((s) => s.id === "deep_learning"), "Deep learning must be in AI Engineer tree");

    const dlSkill = rawSkills.find((s) => s.id === "deep_learning");
    assert.ok(dlSkill.prerequisites.includes("machine_learning"), "Deep learning requires machine learning");
});

test("Counterfactual Simulation: actions catalog contains valid positive score gains and timelines", () => {
    assert.ok(Array.isArray(SIMULATION_ACTIONS), "SIMULATION_ACTIONS must be an array");
    assert.ok(SIMULATION_ACTIONS.length >= 4, "Must have at least 4 simulation actions");

    for (const action of SIMULATION_ACTIONS) {
        assert.ok(action.id, "Action must have an ID");
        assert.ok(action.title, "Action must have a title");
        assert.ok(action.matchScoreGain > 0, "matchScoreGain must be positive");
        assert.ok(action.evidenceCoverageGain > 0, "evidenceCoverageGain must be positive");
        assert.ok(action.readinessScoreGain > 0, "readinessScoreGain must be positive");
        assert.ok(action.estimatedWeeks > 0, "estimatedWeeks must be positive");
        assert.ok(Array.isArray(action.skillsImpacted), "skillsImpacted must be an array");
    }
});

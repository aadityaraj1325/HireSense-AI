const test = require("node:test");
const assert = require("node:assert/strict");
const {
    topicSchema, followUpSchema, bookmarkSchema, saveNoteSchema, explanationValidator,
} = require("./mentorWorkspaceService");

test("validates the mentor workspace request contract", () => {
    assert.equal(topicSchema.safeParse({ topic: "Graph algorithms" }).success, true);
    assert.equal(topicSchema.safeParse({ topic: "x" }).success, false);
    assert.equal(followUpSchema.safeParse({ message: "Can you show an example?" }).success, true);
    assert.equal(bookmarkSchema.safeParse({ bookmarked: true }).success, true);
    assert.equal(saveNoteSchema.safeParse({}).success, true);
});

test("accepts only bounded structured mentor explanations", () => {
    const result = explanationValidator.safeParse({
        summary: "A useful explanation",
        concepts: ["Graph traversal"],
        steps: ["Start with a node"],
        examples: [],
        pitfalls: [],
        practiceQuestions: ["When would you use BFS?"],
        resources: [],
    });
    assert.equal(result.success, true);
    assert.equal(explanationValidator.safeParse({ summary: "" }).success, false);
    assert.equal(explanationValidator.safeParse({ summary: "ok", concepts: Array(21).fill("x") }).success, false);
});

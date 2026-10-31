const test = require("node:test");
const assert = require("node:assert/strict");
const {
    generateSchema, readinessFor, normalizeResource, deterministicRoadmap,
    roadmapOutputValidator, stripJsonWrapper, validationDetails,
    learningNoteSchema, aggregateCalendarActivity,
} = require("./careerRoadmapService");

test("validates roadmap generation input and target setup", () => {
    const result = generateSchema.safeParse({
        resumeId: "507f1f77bcf86cd799439011",
        targetJob: { title: "Backend Engineer" },
    });
    assert.equal(result.success, true);
    assert.equal(result.data.targetJob.timeframeWeeks, 8);
    assert.equal(generateSchema.safeParse({ resumeId: "bad", targetJob: { title: "x" } }).success, false);
});

test("marks only explicitly allowed official HTTPS resources as verified", () => {
    assert.equal(normalizeResource({ title: "Docs", url: "https://developer.mozilla.org/en-US/docs" }).verified, true);
    assert.equal(normalizeResource({ title: "Unknown", url: "https://example.com/course" }).verified, false);
    assert.equal(normalizeResource({ title: "No link" }).verified, false);
});

test("deterministic roadmap is bounded and computes readiness from completed work", () => {
    const roadmap = deterministicRoadmap({
        resumeText: "Experience with JavaScript",
        targetJob: { title: "Engineer", timeframeWeeks: 2 },
    });
    assert.equal(roadmap.milestones.length, 2);
    assert.equal(roadmap.dailyTasks.length, 6);
    roadmap.dailyTasks.forEach((task, index) => { task.status = index < 3 ? "completed" : "pending"; });
    const readiness = readinessFor({ ...roadmap, progress: { totalTasks: 6, completedTasks: 3 }, assessments: [] });
    assert.equal(readiness.score, 35);
    assert.equal(readiness.status, "developing");
});

test("accepts fenced JSON and coerces numeric AI fields", () => {
        const parsed = JSON.parse(stripJsonWrapper("```json\n{\"skillGaps\":[],\"milestones\":[],\"dailyTasks\":[],\"resources\":[]}\n```"));
        assert.deepEqual(parsed.resources, []);
        const result = roadmapOutputValidator.safeParse({
            skillGaps: [{ skill: "Python", currentLevel: "unknown", targetLevel: "intermediate", priority: "high", evidence: "", learningObjectives: ["Practice"] }],
            milestones: [{ week: "1", title: "Foundations", goals: ["Learn"], skills: ["Python"], assessment: "Exercise" }],
            dailyTasks: [{ day: "1", week: "1", title: "Practice", description: "Do it", estimatedMinutes: "60" }],
            resources: [],
        });
        assert.equal(result.success, true);
        assert.equal(result.data.dailyTasks[0].estimatedMinutes, 60);
});

test("reports invalid roadmap output fields without accepting malformed data", () => {
        const result = roadmapOutputValidator.safeParse({
            skillGaps: [{ skill: "Python", currentLevel: "expert", targetLevel: "intermediate", priority: "high" }],
            milestones: [],
            dailyTasks: [{ day: "monday", week: "1", title: "Practice" }],
            resources: [],
        });

        assert.equal(result.success, false);
        const details = validationDetails(result.error);
        assert.ok(details.some((detail) => detail.field.includes("skillGaps.0.currentLevel")));
        assert.ok(details.some((detail) => detail.field.includes("milestones")));
});

test("validates date-only learning notes without timezone conversion", () => {
    const result = learningNoteSchema.safeParse({
        noteDate: "2026-10-31",
        title: "Promise chains",
        content: "Practice error handling.",
        tags: ["javascript", "async"],
    });
    assert.equal(result.success, true);
    assert.equal(result.data.noteDate, "2026-10-31");
    assert.equal(learningNoteSchema.safeParse({ noteDate: "2026-10-31T00:00:00.000Z", title: "x", content: "y" }).success, false);
});

test("aggregates tasks and notes by date-only calendar keys", () => {
    const calendar = aggregateCalendarActivity({
        tasks: [
            { _id: "task-1", scheduledDate: "2026-10-31", title: "Read" },
            { _id: "task-2", scheduledFor: new Date("2026-11-01T12:00:00.000Z"), title: "Build" },
        ],
        notes: [{ _id: "note-1", noteDate: "2026-10-31", title: "Key idea" }],
    }, { month: "2026-10" });
    assert.deepEqual(Object.keys(calendar), ["2026-10-31"]);
    assert.equal(calendar["2026-10-31"].tasks.length, 1);
    assert.equal(calendar["2026-10-31"].notes.length, 1);
});

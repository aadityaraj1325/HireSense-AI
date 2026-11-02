const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const targetService = require("./targetService");

describe("Target Service: Spaced Repetition & Productivity Logic", () => {
    test("calculates correct spaced repetition intervals based on confidence rating", () => {
        const baseDate = new Date("2026-11-01T12:00:00Z");

        // Test Level 1 -> Level 2 (+3 days) on 'easy'
        const nextDateEasy = targetService.calculateNextRevisionDate(baseDate, 1, "easy");
        const diffEasyDays = Math.round((nextDateEasy - baseDate) / (1000 * 60 * 60 * 24));
        assert.strictEqual(diffEasyDays, 3);

        // Test Level 2 -> Level 3 (+7 days)
        const nextDateL2 = targetService.calculateNextRevisionDate(baseDate, 2, "moderate");
        const diffL2Days = Math.round((nextDateL2 - baseDate) / (1000 * 60 * 60 * 24));
        assert.strictEqual(diffL2Days, 7);

        // Test 'forgot' resets interval to 1 day
        const nextDateForgot = targetService.calculateNextRevisionDate(baseDate, 4, "forgot");
        const diffForgotDays = Math.round((nextDateForgot - baseDate) / (1000 * 60 * 60 * 24));
        assert.strictEqual(diffForgotDays, 1);
    });

    test("computes Goal Reality Score bounded between 0 and 100 with qualitative grade", () => {
        const mockTasks = [
            { status: "completed", date: "2026-11-01" },
            { status: "completed", date: "2026-11-01" },
            { status: "completed", date: "2026-11-01" },
            { status: "pending", date: "2026-11-01" },
        ];

        const scoreObj = targetService.computeRealityScoreFromData(mockTasks, 5);
        assert.ok(scoreObj.score >= 0 && scoreObj.score <= 100);
        assert.ok(["Elite", "Great", "Good", "Needs Adjustment", "Over-Planning Alert"].includes(scoreObj.grade));
        assert.ok(typeof scoreObj.description === "string");
        assert.ok(Array.isArray(scoreObj.factors));
    });

    test("handles zero tasks gracefully without NaN or division by zero", () => {
        const scoreObj = targetService.computeRealityScoreFromData([], 0);
        assert.strictEqual(scoreObj.score, 75);
        assert.strictEqual(scoreObj.grade, "Calibrating");
    });
});


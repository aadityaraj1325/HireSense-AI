function clampScore(value) {
    return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function sumBreakdown(breakdown) {
    return clampScore(Object.values(breakdown || {}).reduce(
        (sum, value) => sum + (Number.isFinite(Number(value)) ? Number(value) : 0),
        0
    ));
}

module.exports = { clampScore, sumBreakdown };

const ApiError = require("../utils/ApiError");

const validate = (schema, source = "body") => (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
        const details = result.error.issues.map((issue) => ({
            field: issue.path.length ? issue.path.join(".") : source,
            message: issue.message,
            expected: issue.expected || "valid value",
            received: issue.received || typeof issue.input,
        }));
        const error = ApiError.badRequest("Validation failed", details, "REQUEST_VALIDATION");
        if (req.originalUrl.includes("/career-roadmaps/generate")) {
            error.code = "ROADMAP_REQUEST_VALIDATION_FAILED";
            console.error("[career-roadmap validation]", JSON.stringify({
                stage: "REQUEST_VALIDATION",
                details,
            }));
        }
        return next(error);
    }
    req[source] = result.data;
    next();
}

module.exports = {validate};

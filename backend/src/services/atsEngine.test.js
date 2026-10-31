const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateCompatibility } = require("./atsEngine");

const resume = {
    basics: { title: "Frontend Engineer" },
    summary: "Frontend engineer building web applications.",
    skills: ["React.js", "JavaScript", "Node.js"],
    experience: [{ role: "Frontend Engineer", bullets: ["Developed RESTful endpoints and reusable UI components."] }],
    projects: [{ name: "Hiring platform", description: "Built a React application.", tech: ["MongoDB"] }],
    education: [{ degree: "B.Tech", fieldOfStudy: "Computer Science", institution: "University" }],
    certifications: [],
};

test("classifies exact, synonym, and missing requirements without duplicate credit", () => {
    const result = calculateCompatibility({
        parsedSections: resume,
        rawText: JSON.stringify(resume),
        jobDescription: "React engineers build frontend applications with REST API integrations.",
        jobRequirements: {
            mandatorySkills: ["React", "REST API", "AWS"],
            preferredSkills: ["JavaScript", "React"],
            technicalRequirements: [],
            experienceRequirements: [],
            educationRequirements: [],
            certifications: [],
            responsibilities: [],
            keywords: [],
        },
    });

    assert.equal(result.rubricVersion, "job-compatibility-v1");
    assert.equal(result.keywordMatches.filter((item) => item.requirement === "React").length, 1);
    assert.equal(result.keywordMatches.find((item) => item.requirement === "React").matchType, "Synonym Match");
    assert.equal(result.keywordMatches.find((item) => item.requirement === "REST API").matchType, "Synonym Match");
    assert.equal(result.keywordMatches.find((item) => item.requirement === "AWS").matchType, "Missing");
    assert.equal(result.keywordMatches.find((item) => item.requirement === "React").category, "skill");
    assert.equal(result.keywordMatches.find((item) => item.requirement === "React").confidence, 0.9);
    assert.match(result.keywordMatches.find((item) => item.requirement === "React").jobEvidence, /React/i);
    assert.equal(Object.values(result.breakdown).reduce((sum, value) => sum + value, 0), result.score);
});

test("never recommends unsupported requirements as confirmed skills", () => {
    const result = calculateCompatibility({
        parsedSections: resume,
        rawText: "",
        jobRequirements: {
            mandatorySkills: ["Docker"],
            preferredSkills: [],
            technicalRequirements: [],
            experienceRequirements: [],
            educationRequirements: [],
            certifications: [],
            responsibilities: [],
            keywords: [],
        },
    });

    assert.equal(result.recommendations[0].requiresConfirmation, true);
});

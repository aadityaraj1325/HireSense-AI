/**
 * Skill Dependency DNA Service
 * Provides canonical dependency trees for technical roles, maps evidence status,
 * identifies prerequisite violations, and builds directed acyclic graph (DAG) layouts.
 */

const ROLE_DEPENDENCY_TREES = {
    "Full Stack Engineer": [
        {
            id: "html_css_js",
            label: "HTML5, CSS3 & JavaScript Basics",
            category: "frontend",
            level: 1,
            prerequisites: [],
            keywords: ["html", "css", "javascript", "js", "dom"],
            importance: "Foundation",
            whyPrerequisite: "Core web standards required to construct browser user interfaces.",
        },
        {
            id: "typescript",
            label: "TypeScript & Static Typing",
            category: "frontend",
            level: 2,
            prerequisites: ["html_css_js"],
            keywords: ["typescript", "ts", "types", "interfaces"],
            importance: "Core Requirement",
            whyPrerequisite: "Ensures type safety and scalability across large codebases.",
        },
        {
            id: "react_frontend",
            label: "Modern React & Component Design",
            category: "frontend",
            level: 2,
            prerequisites: ["html_css_js"],
            keywords: ["react", "react.js", "jsx", "hooks", "components", "vue", "next.js"],
            importance: "Core Requirement",
            whyPrerequisite: "Enables declarative, state-driven user interface architecture.",
        },
        {
            id: "node_express",
            label: "Node.js & Express Backend Architecture",
            category: "backend",
            level: 2,
            prerequisites: ["html_css_js"],
            keywords: ["node", "node.js", "express", "backend", "middleware"],
            importance: "Core Requirement",
            whyPrerequisite: "Enables server-side processing, routing, and business logic execution.",
        },
        {
            id: "rest_graphql_apis",
            label: "RESTful & GraphQL API Design",
            category: "backend",
            level: 3,
            prerequisites: ["node_express", "typescript"],
            keywords: ["api", "rest", "graphql", "endpoints", "json"],
            importance: "Core Requirement",
            whyPrerequisite: "Establishes clean client-server communication contracts and protocol handling.",
        },
        {
            id: "databases_orm",
            label: "Databases (MongoDB / PostgreSQL) & ORM",
            category: "database",
            level: 3,
            prerequisites: ["node_express"],
            keywords: ["mongodb", "sql", "postgresql", "mysql", "mongoose", "prisma", "database"],
            importance: "Core Requirement",
            whyPrerequisite: "Guarantees reliable persistence, indexing, and transactional integrity.",
        },
        {
            id: "dsa_problem_solving",
            label: "Data Structures & Algorithm Optimization",
            category: "dsa",
            level: 2,
            prerequisites: ["html_css_js"],
            keywords: ["algorithms", "dsa", "leetcode", "arrays", "trees", "graphs", "sorting"],
            importance: "Important",
            whyPrerequisite: "Provides computational efficiency, space-time awareness, and technical interview readiness.",
        },
        {
            id: "git_collaboration",
            label: "Git Version Control & PR Workflows",
            category: "devops",
            level: 1,
            prerequisites: [],
            keywords: ["git", "github", "commit", "pull request", "branch"],
            importance: "Core Requirement",
            whyPrerequisite: "Foundational for distributed team collaboration, code reviews, and history tracking.",
        },
        {
            id: "state_management_caching",
            label: "State Management & Redis Caching",
            category: "frontend",
            level: 3,
            prerequisites: ["react_frontend", "databases_orm"],
            keywords: ["redux", "tanstack", "query", "redis", "caching", "state"],
            importance: "Important",
            whyPrerequisite: "Prevents duplicate network requests and optimizes application latency.",
        },
        {
            id: "docker_containerization",
            label: "Docker Containerization & Deployment",
            category: "devops",
            level: 4,
            prerequisites: ["node_express", "git_collaboration"],
            keywords: ["docker", "dockerfile", "container", "compose", "deployment"],
            importance: "Important",
            whyPrerequisite: "Standardizes environment execution across local dev and production servers.",
        },
        {
            id: "fullstack_system_architecture",
            label: "End-to-End Production Full Stack Systems",
            category: "system_design",
            level: 4,
            prerequisites: ["rest_graphql_apis", "databases_orm", "docker_containerization"],
            keywords: ["system design", "architecture", "microservices", "production", "fullstack", "end-to-end"],
            importance: "Core Requirement",
            whyPrerequisite: "Demonstrates synthesis of all architectural tiers into verifiable production products.",
        },
    ],
    "AI Engineer": [
        {
            id: "python_core",
            label: "Python Programming & Virtual Environments",
            category: "ai_ml",
            level: 1,
            prerequisites: [],
            keywords: ["python", "py", "pip", "poetry", "oop"],
            importance: "Foundation",
            whyPrerequisite: "The primary lingua franca for modern machine learning research and engineering.",
        },
        {
            id: "math_statistics",
            label: "Linear Algebra, Calculus & Probability",
            category: "ai_ml",
            level: 1,
            prerequisites: [],
            keywords: ["math", "statistics", "calculus", "probability", "matrix", "vector"],
            importance: "Foundation",
            whyPrerequisite: "Underpins loss functions, backpropagation, and optimization mechanics.",
        },
        {
            id: "data_processing",
            label: "Data Wrangling (NumPy & Pandas)",
            category: "ai_ml",
            level: 2,
            prerequisites: ["python_core", "math_statistics"],
            keywords: ["numpy", "pandas", "data preprocessing", "cleaning", "eda"],
            importance: "Core Requirement",
            whyPrerequisite: "Enables tensor manipulation, feature engineering, and training pipeline hygiene.",
        },
        {
            id: "machine_learning",
            label: "Classical ML Algorithms (Scikit-Learn)",
            category: "ai_ml",
            level: 2,
            prerequisites: ["data_processing"],
            keywords: ["scikit-learn", "regression", "classification", "clustering", "random forest", "xgboost"],
            importance: "Core Requirement",
            whyPrerequisite: "Baseline statistical modeling before escalating to complex deep architectures.",
        },
        {
            id: "deep_learning",
            label: "Deep Learning (PyTorch / TensorFlow)",
            category: "ai_ml",
            level: 3,
            prerequisites: ["machine_learning"],
            keywords: ["pytorch", "tensorflow", "neural networks", "cnn", "rnn", "transformers"],
            importance: "Core Requirement",
            whyPrerequisite: "Enables representation learning for unstructured data and large foundation models.",
        },
        {
            id: "model_evaluation",
            label: "Model Evaluation, Metrics & Overfitting Mitigation",
            category: "ai_ml",
            level: 3,
            prerequisites: ["machine_learning"],
            keywords: ["cross-validation", "f1", "precision", "recall", "roc", "auc", "regularization"],
            importance: "Important",
            whyPrerequisite: "Validates generalization capability without leaking test distribution data.",
        },
        {
            id: "model_serving_apis",
            label: "Model Serving & Fast API Microservices",
            category: "backend",
            level: 3,
            prerequisites: ["python_core"],
            keywords: ["fastapi", "flask", "serving", "api", "inference", "rest"],
            importance: "Important",
            whyPrerequisite: "Exposes ML inference endpoints for consumption by production client applications.",
        },
        {
            id: "llm_agents_rag",
            label: "LLM Orchestration, RAG & AI Agents",
            category: "ai_ml",
            level: 4,
            prerequisites: ["deep_learning", "model_serving_apis"],
            keywords: ["rag", "langchain", "llamaindex", "gemini", "openai", "embeddings", "vector db", "agents"],
            importance: "Core Requirement",
            whyPrerequisite: "Modern enterprise AI standard for contextual retrieval and autonomous reasoning.",
        },
        {
            id: "production_ai_ops",
            label: "MLOps, Model Monitoring & Containerized Pipelines",
            category: "devops",
            level: 4,
            prerequisites: ["model_serving_apis"],
            keywords: ["mlops", "docker", "mlflow", "monitoring", "latency", "wandb"],
            importance: "Supporting",
            whyPrerequisite: "Maintains reliability, prevents data drift, and automates retraining pipelines.",
        },
    ],
    "Software Engineer": [
        {
            id: "core_programming",
            label: "Core Programming (Java / C++ / Python / Go)",
            category: "backend",
            level: 1,
            prerequisites: [],
            keywords: ["c++", "java", "python", "go", "golang", "c#", "rust"],
            importance: "Foundation",
            whyPrerequisite: "Fundamental memory model, typing, and syntax mastery.",
        },
        {
            id: "data_structures",
            label: "Core Data Structures (Arrays, Trees, Graphs, Hash Maps)",
            category: "dsa",
            level: 1,
            prerequisites: ["core_programming"],
            keywords: ["arrays", "linked list", "trees", "graphs", "hashmap", "queue", "stack"],
            importance: "Core Requirement",
            whyPrerequisite: "Enables optimal data storage, traversal, and memory efficiency.",
        },
        {
            id: "algorithms_dsa",
            label: "Algorithmic Techniques (DP, Greedy, Binary Search)",
            category: "dsa",
            level: 2,
            prerequisites: ["data_structures"],
            keywords: ["dynamic programming", "greedy", "binary search", "recursion", "backtracking", "leetcode"],
            importance: "Core Requirement",
            whyPrerequisite: "Technical problem-solving benchmark for scaling complex calculations.",
        },
        {
            id: "oop_design_patterns",
            label: "Object-Oriented & Design Patterns",
            category: "system_design",
            level: 2,
            prerequisites: ["core_programming"],
            keywords: ["oop", "solid", "design patterns", "factory", "singleton", "strategy"],
            importance: "Core Requirement",
            whyPrerequisite: "Prevents code duplication and facilitates extensible code modularity.",
        },
        {
            id: "relational_databases",
            label: "Relational Database Management (SQL & Indexing)",
            category: "database",
            level: 2,
            prerequisites: ["core_programming"],
            keywords: ["sql", "postgresql", "mysql", "indexing", "acid", "joins", "normalization"],
            importance: "Core Requirement",
            whyPrerequisite: "Underpins transactional data guarantees across enterprise platforms.",
        },
        {
            id: "unit_testing_debugging",
            label: "Automated Testing, Debugging & Profiling",
            category: "general",
            level: 3,
            prerequisites: ["core_programming"],
            keywords: ["test", "unit test", "jest", "pytest", "junit", "debugging", "profiling"],
            importance: "Important",
            whyPrerequisite: "Ensures regression resilience and verifiable software correctness.",
        },
        {
            id: "system_design_scalability",
            label: "System Design, Caching & Distributed Systems",
            category: "system_design",
            level: 4,
            prerequisites: ["oop_design_patterns", "relational_databases"],
            keywords: ["system design", "distributed", "load balancer", "caching", "microservices", "kafka", "scalability"],
            importance: "Core Requirement",
            whyPrerequisite: "Critical for building fault-tolerant, horizontally scalable distributed services.",
        },
    ],
    "Frontend Engineer": [
        {
            id: "html_css_core",
            label: "Semantic HTML5, CSS3 & Responsive Design",
            category: "frontend",
            level: 1,
            prerequisites: [],
            keywords: ["html", "css", "flexbox", "grid", "responsive", "media query"],
            importance: "Foundation",
            whyPrerequisite: "Fundamental document structure and multi-device presentation layer.",
        },
        {
            id: "modern_javascript",
            label: "Modern JavaScript (ES6+, Async, DOM, Closures)",
            category: "frontend",
            level: 1,
            prerequisites: ["html_css_core"],
            keywords: ["javascript", "es6", "async", "promises", "dom", "closures", "event loop"],
            importance: "Foundation",
            whyPrerequisite: "Client-side execution runtime and interactive browser programming.",
        },
        {
            id: "typescript_frontend",
            label: "TypeScript for Frontend Interfaces & Component Props",
            category: "frontend",
            level: 2,
            prerequisites: ["modern_javascript"],
            keywords: ["typescript", "tsx", "interfaces", "types", "generics"],
            importance: "Core Requirement",
            whyPrerequisite: "Protects UI components against runtime prop type errors.",
        },
        {
            id: "react_component_architecture",
            label: "React Hooks, Context & Component Life Cycle",
            category: "frontend",
            level: 2,
            prerequisites: ["modern_javascript", "typescript_frontend"],
            keywords: ["react", "hooks", "custom hooks", "usememo", "usecallback", "jsx"],
            importance: "Core Requirement",
            whyPrerequisite: "Industry standard for modular component-driven frontend architecture.",
        },
        {
            id: "css_ui_systems",
            label: "Design Systems & Tailwind CSS / CSS Modules",
            category: "frontend",
            level: 2,
            prerequisites: ["html_css_core"],
            keywords: ["tailwind", "css modules", "design system", "shadcn", "styled-components"],
            importance: "Important",
            whyPrerequisite: "Speeds UI development and enforces consistent design tokens across views.",
        },
        {
            id: "state_management_querying",
            label: "Client State & Async Server Sync (TanStack Query)",
            category: "frontend",
            level: 3,
            prerequisites: ["react_component_architecture"],
            keywords: ["tanstack", "query", "redux", "zustand", "caching", "optimistic"],
            importance: "Core Requirement",
            whyPrerequisite: "Prevents stale data states and manages asynchronous server fetching cleanly.",
        },
        {
            id: "web_perf_accessibility",
            label: "Web Performance, Lighthouse & WCAG Accessibility",
            category: "frontend",
            level: 3,
            prerequisites: ["react_component_architecture"],
            keywords: ["lighthouse", "accessibility", "a11y", "wcag", "bundle size", "lazy loading"],
            importance: "Important",
            whyPrerequisite: "Crucial for SEO, user retention, and compliance with accessibility guidelines.",
        },
        {
            id: "ssr_nextjs",
            label: "Server-Side Rendering (Next.js / SSR / SSG)",
            category: "frontend",
            level: 4,
            prerequisites: ["react_component_architecture", "typescript_frontend"],
            keywords: ["next.js", "ssr", "ssg", "server components", "routing"],
            importance: "Core Requirement",
            whyPrerequisite: "Enables fast first-contentful paint, server rendering, and modern web delivery.",
        },
    ],
};

function getDependencyTreeForRole(targetRole = "Full Stack Engineer") {
    if (ROLE_DEPENDENCY_TREES[targetRole]) {
        return ROLE_DEPENDENCY_TREES[targetRole];
    }
    // Match partial names or default to Software Engineer
    if (/ai|ml|machine learning/i.test(targetRole)) return ROLE_DEPENDENCY_TREES["AI Engineer"];
    if (/frontend|ui|web/i.test(targetRole)) return ROLE_DEPENDENCY_TREES["Frontend Engineer"];
    if (/full stack|fullstack/i.test(targetRole)) return ROLE_DEPENDENCY_TREES["Full Stack Engineer"];
    return ROLE_DEPENDENCY_TREES["Software Engineer"];
}

/**
 * Builds the visual DNA graph structure with coordinates, evidence status, and animated connections
 */
function buildVisualDnaGraph(targetRole, evidenceMap = new Map()) {
    const rawSkills = getDependencyTreeForRole(targetRole);

    // Compute status and layout coordinates for each skill
    const nodes = [];
    const edges = [];

    // Group skills by level for 2D DAG layout
    const levelGroups = {};
    for (const skill of rawSkills) {
        if (!levelGroups[skill.level]) levelGroups[skill.level] = [];
        levelGroups[skill.level].push(skill);
    }

    const startX = 60;
    const levelSpacingX = 220;
    const nodeHeightY = 90;
    const startY = 60;

    Object.entries(levelGroups).forEach(([levelStr, skillsAtLevel]) => {
        const levelNum = Number(levelStr);
        const xPos = startX + (levelNum - 1) * levelSpacingX;
        const totalHeight = skillsAtLevel.length * nodeHeightY;

        skillsAtLevel.forEach((skill, index) => {
            const yPos = startY + index * nodeHeightY + (300 - totalHeight) / 2;

            let evidenceInfo = { status: "not_yet_evidenced", evidenceCount: 0 };
            if (evidenceMap instanceof Set) {
                const hasSkill =
                    evidenceMap.has(skill.id.toLowerCase()) ||
                    evidenceMap.has(skill.label.toLowerCase()) ||
                    evidenceMap.has(skill.id) ||
                    evidenceMap.has(skill.label);
                if (hasSkill) {
                    evidenceInfo = { status: "demonstrated", evidenceCount: 1 };
                }
            } else if (evidenceMap instanceof Map) {
                const found =
                    evidenceMap.get(skill.id) ||
                    evidenceMap.get(skill.label) ||
                    evidenceMap.get(skill.id.toLowerCase());
                if (found) {
                    evidenceInfo = typeof found === "object" ? found : { status: "demonstrated", evidenceCount: 1 };
                }
            } else if (evidenceMap && typeof evidenceMap === "object") {
                const found = evidenceMap[skill.id] || evidenceMap[skill.label] || evidenceMap[skill.id.toLowerCase()];
                if (found) {
                    evidenceInfo = typeof found === "object" ? found : { status: "demonstrated", evidenceCount: 1 };
                }
            }

            nodes.push({
                id: skill.id,
                label: skill.label,
                category: skill.category,
                level: skill.level,
                status: evidenceInfo.status || "not_yet_evidenced",
                prerequisites: skill.prerequisites || [],
                whyPrerequisite: skill.whyPrerequisite,
                importance: skill.importance,
                isTargetRequirement: (skill.importance || "").includes("Core"),
                evidenceCount: evidenceInfo.evidenceCount || 0,
                x: Math.round(xPos),
                y: Math.max(40, Math.round(yPos)),
                position: {
                    x: Math.round(xPos),
                    y: Math.max(40, Math.round(yPos)),
                },
            });

            // Create edges from prerequisites to this node
            for (const prereqId of skill.prerequisites) {
                edges.push({
                    id: `${prereqId}->${skill.id}`,
                    source: prereqId,
                    target: skill.id,
                    animated: evidenceInfo.status === "in_progress" || evidenceInfo.status === "demonstrated",
                    label: "prerequisite",
                });
            }
        });
    });

    return { nodes, edges };
}

module.exports = {
    ROLE_DEPENDENCY_TREES,
    getDependencyTreeForRole,
    buildVisualDnaGraph,
};

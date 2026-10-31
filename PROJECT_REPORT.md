# HireSense AI — Comprehensive Project Report
**Generated:** 2026-10-30  
**Scope:** Entire Project  
**Report Version:** 1.0

> This report was generated from the repository implementation. `AGENT_RULES.md`, `PRD.md`, `TASK_LIST.md`, and `PREVIOUS_TASKS.md` were not present, so requirements and historical completion claims could not be cross-checked against those documents.

## 1. Executive Summary

HireSense AI is a full-stack AI resume improvement application. A user creates an account, uploads a PDF resume, and receives a structured resume representation plus an AI-generated ATS score, strengths, issues, missing keywords, and rewrite suggestions. Users can create improved resume versions, compare versions, inspect history and analytics, and export a resume from the React web interface. The backend is an Express API backed by MongoDB, while Google Gemini provides parsing, role suggestion, and resume analysis.

## 2. Project Overview

### 2.1 Purpose

The product helps job seekers make resumes more readable by applicant tracking systems and more targeted to a role or job description. It preserves uploaded resume versions, records analysis results, and turns selected AI bullet rewrites into new versions rather than overwriting the original.

### 2.2 Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | >=20 | Backend runtime |
| Express | ^5.2.1 | HTTP API framework |
| MongoDB | Mongo image 7-jammy / Mongoose ^9.6.3 | Persistent document database |
| React | ^19.2.6 | Frontend UI |
| Vite | ^8.0.12 | Frontend development and production build |
| React Router | ^7.15.1 | Browser routing and protected routes |
| TanStack React Query | ^5.100.14 | Server-state fetching, caching, and mutations |
| Axios | ^1.16.1 | Browser-to-API HTTP client |
| Tailwind CSS | ^4.3.0 | Utility styling |
| Recharts | ^3.8.1 | Dashboard and analytics charts |
| Framer Motion | ^12.40.0 | UI animation |
| React PDF renderer | ^4.5.1 | Resume export rendering |
| Google GenAI SDK | ^2.6.0 | Gemini structured parsing and analysis |
| Zod | ^4.4.3 | Request and AI-response validation |
| Multer | ^2.1.1 | In-memory PDF uploads |
| pdf-parse | ^2.4.5 | PDF text extraction |
| bcrypt | ^6.0.0 | Password hashing |
| jsonwebtoken | ^9.0.3 | Session token signing and verification |
| Nginx | Container image configuration | Serves the built frontend and proxies API requests |
| Docker Compose | Compose files | Local production/development orchestration |
| GitHub Actions / Jenkins | Repository configuration | CI checks, image builds, and compose verification |

### 2.3 Architecture Overview

The application uses a browser SPA plus REST API architecture:

1. Nginx serves the Vite-built React application.
2. React calls `/api` through Axios with credentials enabled.
3. Express mounts authentication, resume, dashboard, insight, version, history, and health routers.
4. Cookie-based JWT authentication identifies the current user.
5. MongoDB stores users, resume records, versions, and analyses.
6. PDF text is extracted in memory and sent to Gemini for structured parsing.
7. Gemini returns validated JSON for ATS analysis and role suggestions.

Important project tree:

```text
HireSense-AI/
├── backend/
│   ├── src/server.js
│   ├── src/config/                 # Environment and MongoDB setup
│   ├── src/middleware/             # Auth, validation, upload, errors, limits
│   ├── src/models/                 # User, Resume, ResumeVersion, Analysis
│   ├── src/routes/                 # REST API endpoints
│   ├── src/services/               # Gemini, PDF, parser, diff services
│   └── src/utils/                  # JWT, async handler, API errors
├── frontend/
│   ├── src/App.jsx
│   ├── src/routes.jsx
│   ├── src/api/                    # Axios API wrappers
│   ├── src/context/                # Auth, theme, and UI state
│   ├── src/hooks/                  # React Query hooks
│   ├── src/pages/                  # Application pages
│   └── src/components/             # Feature and layout components
├── docker-compose.yml
├── docker-compose.dev.yml
├── Jenkinsfile
├── .github/workflows/ci-cd.yml
├── DEPLOYMENT.md
└── README.md
```

## 3. Features and Functionality

### 3.1 Account Registration, Login, and Profile
**Status:** Implemented  
**Description:** Users register with a name, email, and password, log in, update their name, change their password, and log out.

**How it works:**
1. Zod validates request bodies.
2. Registration normalizes the email, rejects duplicates, hashes the password with bcrypt, creates the user, and issues a JWT cookie.
3. Login verifies the bcrypt hash and issues the same cookie.
4. The frontend calls `/auth/me` during startup and redirects unauthenticated users to `/login`.
5. Logout clears the cookie and clears the React Query cache.

**Files involved:**
- `backend/src/routes/auth.js` — auth endpoints and validation.
- `backend/src/models/User.js` — user schema and password helpers.
- `backend/src/middleware/auth.js` — cookie token verification and user lookup.
- `backend/src/utils/jwt.js` — token and cookie configuration.
- `frontend/src/context/AuthContext.jsx` — client session state.
- `frontend/src/pages/Login.jsx`, `frontend/src/pages/Register.jsx`, `frontend/src/pages/Settings.jsx` — auth UI.

**Known limitations:** There is no role model or OAuth provider. Authentication is session-cookie based, not a multi-role authorization system.

### 3.2 PDF Resume Upload and Structured Parsing
**Status:** Implemented  
**Description:** An authenticated user uploads one PDF up to 5 MB. The backend extracts text, parses sections with Gemini, and creates the first resume version.

**How it works:**
1. Multer accepts exactly one `application/pdf` file in memory.
2. `pdf-parse` extracts text and rejects empty or very short documents.
3. Gemini maps the text into basics, summary, experience, education, skills, projects, certifications, languages, and interests.
4. A `Resume` record and V1 `ResumeVersion` are saved.
5. The frontend refreshes the resume list and displays parsed information.

**Files involved:** `backend/src/routes/resumes.js`, `backend/src/middleware/upload.js`, `backend/src/services/pdfService.js`, `backend/src/services/structuredParser.js`, `backend/src/models/Resume.js`, `backend/src/models/ResumeVersion.js`, and `frontend/src/pages/Resumes.jsx`.

**Known limitations:** Uploads are held in memory and are not stored as original files. Scanned/image-only PDFs are rejected because OCR is not provided.

### 3.3 AI Resume Analysis
**Status:** Implemented  
**Description:** A resume version can be scored against an optional target role and job description.

**How it works:**
1. The backend loads a resume and verifies ownership.
2. Gemini receives the raw extracted text and optional targeting context.
3. The response is constrained to JSON and validated with Zod.
4. The result is stored as an `Analysis` linked to the user, resume, and version.
5. The UI presents the ATS score, score breakdown, issues, strengths, keywords, and rewrite candidates.

Analysis output includes:
- ATS score from 0 to 100.
- Keywords, formatting, impact, and clarity subscores from 0 to 25.
- Issues with severity, explanation, and fix.
- Strengths and evidence.
- Bullet rewrites and rationales.
- Present and missing keywords.
- Summary and originality/cliche wording findings.

**Known limitations:** Analysis depends on a configured Gemini API key and external model availability. The API has a five-per-minute analysis limiter object, but the limiter is declared and not applied to the analysis route.

### 3.4 Role Suggestions
**Status:** Implemented  
**Description:** Given a job description, Gemini suggests up to five realistic technical job titles.

**Files involved:** `backend/src/routes/resumes.js`, `backend/src/services/geminiService.js`, and `frontend/src/api/resumes.js`.

**Known limitations:** Suggestions require at least 20 characters and a configured Gemini key.

### 3.5 Resume Rewrites and Versioning
**Status:** Implemented  
**Description:** Selected AI bullet rewrites and/or a target role produce a new immutable resume version.

**How it works:**
1. The client submits an analysis ID and optional rewrite IDs, label, and target role.
2. The backend confirms the analysis belongs to the resume.
3. Original text occurrences are replaced; missing originals are appended.
4. Structured bullets are patched and the updated text is reparsed.
5. The new version references its parent and becomes the current version.

**Files involved:** `backend/src/routes/resumes.js`, `backend/src/models/ResumeVersion.js`, `frontend/src/pages/ResumeDetail.jsx`, `frontend/src/pages/Versions.jsx`, and analysis components such as `BulletRewrites.jsx`.

**Known limitations:** Replacement uses the first exact text occurrence and can append a rewrite when the original text cannot be found. There is no manual editor endpoint for arbitrary resume text.

### 3.6 Version Diff
**Status:** Implemented  
**Description:** Two versions can be compared by words or lines.

**Files involved:** `backend/src/services/diffService.js`, `backend/src/routes/resumes.js`, and `frontend/src/pages/Versions.jsx`.

### 3.7 Dashboard, Insights, and History
**Status:** Implemented  
**Description:** Authenticated users get aggregate performance metrics, keyword/issue trends, version history, and activity events.

The dashboard calculates average score, best score, score trend, frequent issues, missing/present keywords, and per-resume performance. Insights and history endpoints provide supporting datasets used by the analytics pages and dashboard components.

**Files involved:** `backend/src/routes/dashboard.js`, `backend/src/routes/insights.js`, `backend/src/routes/versions.js`, `backend/src/routes/history.js`, `frontend/src/hooks/useDashboard.js`, `frontend/src/hooks/useAnalytics.js`, and dashboard/analytics page components.

### 3.8 Resume Export
**Status:** Implemented in frontend  
**Description:** The export route renders a resume document using the React PDF renderer.

**Files involved:** `frontend/src/pages/Export.jsx` and `frontend/src/components/export/ResumeDocument.jsx`.

**Known limitations:** Export is a client-side document rendering feature; no server-side export or stored output is present.

### 3.9 Theme, Layout, Notifications, and Landing Experience
**Status:** Implemented  
**Description:** Public landing, login, registration, protected application shell, theme switching, notifications, and reusable UI components are included.

**Files involved:** `frontend/src/pages/Landing.jsx`, `frontend/src/components/landing/`, `frontend/src/components/layout/`, `frontend/src/components/ui/`, `frontend/src/context/ThemeContext.jsx`, and `frontend/src/context/UIContext.jsx`.

## 4. Data Models

### 4.1 User
**Purpose:** Stores an account and authentication credentials.

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `email` | String | Yes | Lowercase, trimmed, unique email |
| `passwordHash` | String | Yes | Bcrypt hash, excluded from normal JSON |
| `name` | String | Yes | Display name, maximum 80 characters |
| `createdAt`, `updatedAt` | Date | Automatic | Mongoose timestamps |

### 4.2 Resume
**Purpose:** User-owned resume container.

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `userId` | ObjectId | Yes | Owner reference |
| `title` | String | Yes | Display title, maximum 120 |
| `currentVersionId` | ObjectId | No | Current version reference |
| `latestVersionNumber` | Number | No | Latest version counter |
| `createdAt`, `updatedAt` | Date | Automatic | Timestamps |

### 4.3 ResumeVersion
**Purpose:** Immutable uploaded or rewritten snapshot.

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `resumeId` | ObjectId | Yes | Parent resume |
| `versionNumber` | Number | Yes | Positive, unique per resume |
| `label` | String | Yes | UI label such as V1 |
| `rawText` | String | Yes | Extracted or rewritten text |
| `parsedSections` | Embedded object | No | Structured resume data |
| `sourceType` | Enum | Yes | `upload` or `rewrite` |
| `parentVersionId` | ObjectId | No | Version lineage |
| `latestAnalysisId` | ObjectId | No | Most recent analysis for the version |
| timestamps | Date | Automatic | Creation and update dates |

Structured sections include basics/contact links, summary, experience, education, skills, projects, certifications, languages, and interests.

### 4.4 Analysis
**Purpose:** Stores one AI evaluation of a particular resume version.

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `userId`, `resumeId`, `versionId` | ObjectId | Yes | Ownership and source links |
| `atsScore` | Number | Yes | 0–100 |
| `scoreBreakdown` | Object | No | Four 0–25 sub-scores |
| `issues` | Array | No | Severity, explanation, and fix |
| `strengths` | Array | No | Title and evidence |
| `bulletRewrites` | Array | No | Original, rewritten, section, rationale |
| `keywordsPresent`, `keywordsMissing` | String arrays | No | Keyword findings |
| `summary` | String | No | Overall verdict |
| `targetRole`, `jobDescription` | String | No | Analysis context |
| `originalityIssues` | Array | No | Phrase, reason, safer suggestion |
| `suggestedRoles` | String array | No | Suggested technical titles |
| `model`, token counters | String/Number | Model required | AI provenance |
| timestamps | Date | Automatic | Creation and update dates |

## 5. Authentication and Authorization

**Auth method:** JWT stored in an HTTP cookie named by `COOKIE_NAME` (default `arr_token`).

**Role system:** No application roles are implemented. Authorization is ownership-based: authenticated users can access only resumes, versions, and analyses associated with their user ID.

**Protected routes:** All `/api/resumes`, `/api/dashboard`, `/api/insights`, `/api/versions`, and `/api/history` routes use `requireAuth`. `/api/auth/me`, profile, and password routes also require authentication. Registration, login, logout, and health are public.

**Token flow:**
1. Registration or login signs `{ sub: userId }`.
2. The token is sent in a cookie using `cookieOptions`.
3. `requireAuth` verifies the token and reloads the user from MongoDB.
4. Invalid, expired, missing, or deleted-user sessions return unauthorized errors.
5. Logout clears the cookie.

## 6. API Reference

All paths below are relative to `/api`.

| Method | Endpoint | Auth | Request / Response | Description |
|--------|----------|------|--------------------|-------------|
| GET | `/health` | No | Response includes status, uptime, DB state | Health check |
| POST | `/auth/register` | No | name, email, password → user | Register |
| POST | `/auth/login` | No | email, password → user | Login |
| POST | `/auth/logout` | No | — → `{ok:true}` | Clear session |
| GET | `/auth/me` | Yes | — → current user | Restore session |
| PUT | `/auth/profile` | Yes | name → user | Update name |
| PUT | `/auth/password` | Yes | currentPassword, newPassword | Change password |
| POST | `/resumes` | Yes | multipart PDF plus optional title | Upload and parse resume |
| GET | `/resumes` | Yes | — → user resumes | List resumes |
| GET | `/resumes/:id` | Yes/owner | — → resume and versions | Get resume summary |
| GET | `/resumes/:id/versions/:versionId` | Yes/owner | — → version | Get full version |
| DELETE | `/resumes/:id` | Yes/owner | — | Delete resume, versions, analyses |
| POST | `/resumes/suggest-roles` | Yes | jobDescription | Suggest target roles |
| POST | `/resumes/:id/analyze` | Yes/owner | versionId, targetRole, jobDescription | Run and save AI analysis |
| GET | `/resumes/:id/analyses` | Yes/owner | — | List analyses |
| GET | `/resumes/:id/versions/:versionId/analysis` | Yes/owner | — | Get latest version analysis |
| POST | `/resumes/:id/rewrite` | Yes/owner | analysisId, rewriteIds, label, targetRole | Create rewritten version |
| GET | `/resumes/:id/diff` | Yes/owner | from, to, mode | Compare versions |
| GET | `/dashboard` | Yes | — | Aggregate score dashboard |
| GET | `/insights` | Yes | — | Insight data |
| GET | `/versions` | Yes | — | Cross-resume version timeline |
| GET | `/history` | Yes | — | Upload, analysis, and rewrite events |

## 7. Frontend Structure

### 7.1 Pages and Routes

| Route | Component | Auth | Description |
|------|-----------|------|-------------|
| `/` | `Landing` | No | Marketing landing page |
| `/login` | `Login` | No | Login form |
| `/register` | `Register` | No | Registration form |
| `/dashboard` | `Dashboard` | Yes | Metrics, trends, and activity |
| `/resumes` | `Resumes` | Yes | Resume list and upload |
| `/resumes/:id` | `ResumeDetail` | Yes | Resume, analysis, and rewrite workflow |
| `/resumes/:id/export` | `Export` | Yes | PDF export view |
| `/insights` | `Insights` | Yes | Insights and keyword analysis |
| `/versions` | `Versions` | Yes | Version list and comparison |
| `/history` | `History` | Yes | Activity history |
| `/settings` | `Settings` | Yes | Profile, password, and preferences |
| `*` | Redirect | No | Redirects to `/` |

### 7.2 Key Components

- `AppShell` — authenticated navigation and page layout.
- `AuthShell` — shared auth-page presentation.
- `AtsGauge`, `ScoreBreakdown`, `ScoreEvolutionChart` — ATS score visualization.
- `IssuesList`, `StrengthsList`, `KeywordChips`, `BulletRewrites` — analysis presentation and rewrite selection.
- `ActivityFeed`, `VersionStack`, `ProfileCard`, `StatCard` — dashboard content.
- `ResumeDocument` — printable/exportable resume document.
- Landing components — public product presentation, benefits, features, CTA, and footer.
- UI components — reusable buttons, dialogs, popovers, inputs, cards, and navigation primitives.

### 7.3 State Management

- TanStack Query manages API data, caching, invalidation, and mutations.
- `AuthContext` manages the current user and auth actions.
- `ThemeContext` stores the theme in local storage.
- `UIContext` manages shared UI state such as notifications/dialog behavior.
- Components use local React state for forms, filters, selected rewrites, and presentation controls.

### 7.4 API Integration

`frontend/src/api/client.js` creates an Axios client with `/api` as the base URL and `withCredentials: true`. Response errors are normalized to `{status, message, details, original}`. API modules cover authentication, resumes, dashboard, and analytics. Hooks such as `useResumes`, `useDashboard`, and `useAnalytics` wrap those modules in React Query.

## 8. Testing

**Testing framework:** No repository test framework or test files were found.

| Area | Tests Written | Tests Passing | Coverage |
|------|---------------|---------------|----------|
| Backend routes/services | 0 | Not measured | Unknown |
| Frontend components/pages | 0 | Not measured | Unknown |
| Integration/API | 0 | Not measured | Unknown |
| Docker/health | CI curl check only | CI-defined | Not a test suite |

The frontend has an ESLint script. CI installs backend dependencies and runs frontend lint with `|| true`, meaning lint failures do not fail the workflow. There is no backend lint or unit-test script.

## 9. Environment and Configuration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGO_URI` | Yes | MongoDB connection string | `mongodb://mongodb:27017/airesumebuilder` |
| `JWT_SECRET` | Yes | JWT signing secret | Strong random secret |
| `PORT` | No | API port, default 5000 | `5000` |
| `NODE_ENV` | No | Runtime mode | `production` |
| `JWT_EXPIRES_IN` | No | JWT lifetime, default 7d | `7d` |
| `COOKIE_NAME` | No | Session cookie name | `arr_token` |
| `CLIENT_ORIGIN` | No | Comma-separated frontend origins | `http://localhost:5173` |
| `GEMINI_API_KEY` | Needed for AI | Google Gemini credential | Secret value |
| `GEMINI_MODEL` | No | Primary Gemini model | `gemini-3.8-flash` |
| `GEMINI_FALLBACK_MODELS` | No | Comma-separated fallback models | `gemini-flash-lite-latest` |
| `GEMINI_TIMEOUT_MS` | No | AI request timeout, default 30000 | `30000` |

`backend/src/config/env.js` terminates startup when `MONGO_URI` or `JWT_SECRET` is absent. Docker Compose supplies the Mongo URI and production port, while the backend `.env` is expected to provide secrets and the Gemini key.

## 10. Known Issues and Bugs

| Issue | Severity | Status | Description |
|------|----------|--------|-------------|
| No product requirements/history files | High | Open | `PRD.md`, `TASK_LIST.md`, `PREVIOUS_TASKS.md`, and `AGENT_RULES.md` are absent, so requirement completion cannot be objectively verified. |
| No automated application tests | High | Open | No unit, component, API, or integration test files are present. |
| Analysis limiter not mounted | High | Open | `analyzeLimiter` is imported/defined but the analysis route does not use it, so expensive Gemini calls are not protected by the intended limit. |
| Frontend lint is non-blocking in CI | Medium | Open | CI uses `npm run lint || true`, allowing lint regressions to pass. |
| Gemini parsing fallback can hide parse failure | Medium | Open | Structured parsing returns an empty structure after repeated failure, which can create a usable-looking version without parsed content. |
| In-memory file processing | Medium | Open | Uploaded PDFs and extracted content consume backend memory and are not persisted as source files. |
| Exact rewrite matching | Medium | Open | Rewrites replace only the first matching occurrence or append text if the original cannot be found. |
| No roles/permissions | Low | Open | The report template expects roles, but the implementation only has authenticated ownership checks. |
| README is sparse | Low | Open | Operational details are primarily in `DEPLOYMENT.md`; the root README does not document the full API or development workflow. |

## 11. Completion Status

Because `PRD.md` and task history files are absent, this is an implementation-based assessment rather than a requirements-based percentage.

| Feature | Evidence in repository | Status | Notes |
|---------|------------------------|--------|-------|
| Public landing experience | React pages/components | Complete | Includes marketing sections and navigation |
| User authentication | Auth routes, cookie JWT, auth context | Complete | No OAuth or roles |
| PDF upload | Multer, PDF parser, upload UI | Complete | 5 MB PDF limit |
| Structured parsing | Gemini parser and version storage | Complete with dependency | Requires Gemini key; fallback may be empty |
| ATS analysis | Gemini service, Analysis model, analysis UI | Complete with dependency | No automated tests |
| Rewrite workflow | Rewrite endpoint and UI components | Complete | Exact text replacement behavior |
| Version history | Version model, list, diff, history API | Complete | Version lineage retained |
| Dashboard/insights | Aggregate endpoints and charts | Complete | Data depends on saved analyses |
| Export | React PDF renderer and export page | Complete | Client-side |
| Deployment | Docker, Compose, Jenkins, GitHub Actions | Partial | CI lint is non-blocking; no test suite |

**Overall implementation completeness:** Approximately **80% of the visible product surface is implemented**, but confidence in functional completeness is reduced by the absence of requirements, historical task records, and automated tests. This is not a PRD completion percentage.

## 12. What Was Built — Session by Session

No `PREVIOUS_TASKS.md` file exists, and Git history was not used as a substitute for the requested session log. Therefore, session-by-session model attribution and dates are unavailable.

## 13. Next Steps and Recommendations

1. Add a real automated test foundation: backend route/service tests, frontend component/page tests, authentication tests, and an upload-to-analysis integration test with mocked Gemini.
2. Apply `analyzeLimiter` to the analysis endpoint and review all expensive AI endpoints for abuse protection.
3. Add and maintain `PRD.md`, `TASK_LIST.md`, and `PREVIOUS_TASKS.md` so product scope and completion can be measured.
4. Make CI fail on frontend lint errors and add backend lint/type or syntax validation.
5. Improve AI failure handling by distinguishing “AI unavailable” from “parsed result is empty” and surfacing the failure to the user.
6. Add observability for Gemini latency, model fallback usage, token cost, rate-limit responses, and upload failures.
7. Consider durable object storage or a documented retention policy if original PDF downloads or recovery are required.
8. Document local setup, API contracts, and frontend environment assumptions in the root README.

## Report Addendum — AI Resume-Based Mock Interview

The project now includes a protected `/interview` frontend route and `/api/interviews` backend resource. `InterviewSession` stores the selected resume/version, target job, skills, requested/current difficulty, generated questions, submitted answers, four-dimensional evaluations, weak concepts, reports, recommendations, and completion timestamps. Gemini generates resume- and role-specific technical, HR, project, and follow-up questions; Zod validates question, evaluation, and report payloads. After each answer, the dynamic engine raises difficulty for scores of 80 or above, lowers it below 50, and otherwise maintains the current level. The answer endpoint can also insert a targeted follow-up question based on weak concepts.

The module supports:

- Session creation from a user's existing resume and optional version.
- Beginner, intermediate, and advanced starting difficulty.
- Answer evaluation for correctness, relevance, clarity, and technical depth.
- Model answers, explanations, feedback, and weak-concept identification.
- Adaptive follow-up questions and difficulty progression.
- Persisted completed-session reports and personalized revision recommendations.
- Cross-session performance summary at `GET /api/interviews/performance/summary`.
- A React setup/session/report experience with previous-session history in the sidebar's **Mock Interview** route.
- Real voice mode using browser `SpeechRecognition`/`webkitSpeechRecognition` for live microphone transcription and `SpeechSynthesis` for reading generated questions aloud. Voice transcripts remain editable before submission and are evaluated by Gemini as transcript text; the backend records whether an answer came from text or voice.

Validation completed after this addition: backend `node --check`, isolated lint for all new interview frontend files, and `npm run build`. The repository-wide frontend lint remains non-blocking because of pre-existing errors in `frontend/src/components/dashboard/VersionStack.jsx` and `frontend/src/routes.jsx`.

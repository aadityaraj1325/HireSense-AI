import { apiClient } from "./client";

export const developerTrackerApi = {
  getProfile: () => apiClient.get("/developer-tracker/profile").then((r) => r.data),
  updateProfile: (body) => apiClient.patch("/developer-tracker/profile", body).then((r) => r.data),
  connectPlatform: (body) => apiClient.post("/developer-tracker/connect", body).then((r) => r.data),
  verifyLink: (body) => apiClient.post("/developer-tracker/verify-link", body).then((r) => r.data),
  disconnectPlatform: (platform) =>
    apiClient.delete(`/developer-tracker/disconnect/${platform}`).then((r) => r.data),
  syncPlatform: (platform = "all") =>
    apiClient.post(`/developer-tracker/sync/${platform}`).then((r) => r.data),
  getDailyHealth: (params) =>
    apiClient.get("/developer-tracker/daily-health", { params }).then((r) => r.data),
  getOverview: (params) =>
    apiClient.get("/developer-tracker/overview", { params }).then((r) => r.data),
  getCalendar: (params) =>
    apiClient.get("/developer-tracker/calendar", { params }).then((r) => r.data),
  getActivities: (params) =>
    apiClient.get("/developer-tracker/activities", { params }).then((r) => r.data),
  createManualActivity: (body) =>
    apiClient.post("/developer-tracker/activities/manual", body).then((r) => r.data),
  deleteActivity: (id) =>
    apiClient.delete(`/developer-tracker/activities/${id}`).then((r) => r.data),
  getFocusSessions: () =>
    apiClient.get("/developer-tracker/focus-sessions").then((r) => r.data),
  createFocusSession: (body) =>
    apiClient.post("/developer-tracker/focus-sessions", body).then((r) => r.data),
  getProofOfWork: (params) =>
    apiClient.get("/developer-tracker/proof-of-work", { params }).then((r) => r.data),
  getSkillIntelligence: () =>
    apiClient.get("/developer-tracker/skill-intelligence").then((r) => r.data),
  getRepositories: (params) =>
    apiClient.get("/developer-tracker/repositories", { params }).then((r) => r.data),
  getSyncLogs: (params) =>
    apiClient.get("/developer-tracker/sync-logs", { params }).then((r) => r.data),
  getRateLimit: () =>
    apiClient.get("/developer-tracker/rate-limit").then((r) => r.data),
  getResumeBridge: () =>
    apiClient.get("/developer-tracker/resume-bridge").then((r) => r.data),
  applyResumeBridge: (body) =>
    apiClient.post("/developer-tracker/resume-bridge/apply", body).then((r) => r.data),
  askCoach: (question) =>
    apiClient.post("/developer-tracker/coach/chat", { question }).then((r) => r.data),
  getReport: (type) =>
    apiClient.get(`/developer-tracker/reports/${type}`).then((r) => r.data),
};

import { apiClient } from "./client";

export const interviewsApi = {
  list: () => apiClient.get("/interviews").then((r) => r.data),
  performance: () => apiClient.get("/interviews/performance/summary").then((r) => r.data),
  get: (id) => apiClient.get(`/interviews/${id}`).then((r) => r.data),
  create: (payload) => apiClient.post("/interviews", payload).then((r) => r.data),
  answer: (id, payload) =>
    apiClient.post(`/interviews/${id}/answers`, payload).then((r) => r.data),
  finish: (id) => apiClient.post(`/interviews/${id}/finish`).then((r) => r.data),

  // Live Interview Studio Endpoints
  analyzeJd: (payload) => apiClient.post("/interviews/analyze-jd", payload).then((r) => r.data),
  studioInit: (payload) => apiClient.post("/interviews/studio/init", payload).then((r) => r.data),
  studioGet: (id) => apiClient.get(`/interviews/studio/${id}`).then((r) => r.data),
  studioTurn: (id, payload) => apiClient.post(`/interviews/studio/${id}/turn`, payload).then((r) => r.data),
  studioFinish: (id, payload) => apiClient.post(`/interviews/studio/${id}/finish`, payload || {}).then((r) => r.data),
  studioMonitoring: (id, payload) => apiClient.post(`/interviews/studio/${id}/monitoring`, payload).then((r) => r.data),
  getActiveSession: () => apiClient.get("/interviews/active").then((r) => r.data),
  pauseSession: (id) => apiClient.post(`/interviews/sessions/${id}/pause`).then((r) => r.data),
  resumeSession: (id) => apiClient.post(`/interviews/sessions/${id}/resume`).then((r) => r.data),
  repeatQuestion: (id) => apiClient.post(`/interviews/sessions/${id}/repeat`).then((r) => r.data),
  startSession: (id) => apiClient.post(`/interviews/sessions/${id}/start`).then((r) => r.data),
  getReport: (id) => apiClient.get(`/interviews/sessions/${id}/report`).then((r) => r.data),
};

import { apiClient } from "./client";

export const interviewsApi = {
  list: () => apiClient.get("/interviews").then((r) => r.data),
  performance: () => apiClient.get("/interviews/performance/summary").then((r) => r.data),
  get: (id) => apiClient.get(`/interviews/${id}`).then((r) => r.data),
  create: (payload) => apiClient.post("/interviews", payload).then((r) => r.data),
  answer: (id, payload) =>
    apiClient.post(`/interviews/${id}/answers`, payload).then((r) => r.data),
  finish: (id) => apiClient.post(`/interviews/${id}/finish`).then((r) => r.data),
};

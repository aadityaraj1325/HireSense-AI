import { apiClient } from "./client";

export const gapIntelligenceApi = {
  getLatest: () => apiClient.get("/gap-intelligence/latest").then((r) => r.data),
  getHistory: (params) => apiClient.get("/gap-intelligence/history", { params }).then((r) => r.data),
  runAnalysis: (body) => apiClient.post("/gap-intelligence/analyze", body).then((r) => r.data),
  getDnaGraph: (role) => apiClient.get("/gap-intelligence/dna-graph", { params: { role } }).then((r) => r.data),
  getSimulationCatalog: () => apiClient.get("/gap-intelligence/simulation-catalog").then((r) => r.data),
  simulate: (body) => apiClient.post("/gap-intelligence/simulate", body).then((r) => r.data),
  submitEvidence: (body) => apiClient.post("/gap-intelligence/submit-evidence", body).then((r) => r.data),
  addToRoadmap: (body) => apiClient.post("/gap-intelligence/add-to-roadmap", body).then((r) => r.data),
  askCopilot: (question) => apiClient.post("/gap-intelligence/copilot", { question }).then((r) => r.data),
};


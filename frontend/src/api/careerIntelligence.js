import { apiClient } from "./client";

export async function getCareerIntelligenceOverview() {
  const res = await apiClient.get("/career-intelligence/overview");
  return res.data;
}

export async function refreshCareerIntelligence() {
  const res = await apiClient.post("/career-intelligence/refresh");
  return res.data;
}


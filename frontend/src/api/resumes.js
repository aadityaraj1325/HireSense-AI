
import { apiClient } from "./client";

export const resumesApi = {
  list: () => apiClient.get("/resumes").then((r) => r.data),
  get: (id) => apiClient.get(`/resumes/${id}`).then((r) => r.data),
  getVersion: (id, versionId) =>
    apiClient.get(`/resumes/${id}/versions/${versionId}`).then((r) => r.data),
  upload: (file, title) => {
    const fd = new FormData();
    fd.append("file", file);
    if (title) fd.append("title", title);
    return apiClient
      .post("/resumes", fd, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data);
  },
  remove: (id) => apiClient.delete(`/resumes/${id}`).then((r) => r.data),
  analyze: (id, body = {}) =>
    apiClient.post(`/resumes/${id}/analyze`, body).then((r) => r.data),
  suggestRoles: (jobDescription) =>
    apiClient.post("/resumes/suggest-roles", { jobDescription }).then((r) => r.data),
  analyses: (id) => apiClient.get(`/resumes/${id}/analyses`).then((r) => r.data),
  keywordIntelligence: (id, versionId) =>
    apiClient.get(`/resumes/${id}/keyword-intelligence`, {
      params: versionId ? { versionId } : undefined,
    }).then((r) => r.data),
  analysisForVersion: (id, versionId) =>
    apiClient.get(`/resumes/${id}/versions/${versionId}/analysis`).then((r) => r.data),
  rewrite: (id, body) =>
    apiClient.post(`/resumes/${id}/rewrite`, body).then((r) => r.data),
  diff: (id, from, to, mode = "words") =>
    apiClient.get(`/resumes/${id}/diff`, { params: { from, to, mode } }).then((r) => r.data),
};

export const careerRoadmapsApi = {
  list: () => apiClient.get("/career-roadmaps").then((r) => r.data),
  get: (id) => apiClient.get(`/career-roadmaps/${id}`).then((r) => r.data),
  getByResume: (resumeId) => apiClient.get(`/career-roadmaps/by-resume/${resumeId}`).then((r) => r.data),
  generate: (body) => apiClient.post("/career-roadmaps/generate", body).then((r) => r.data),
  updateProgress: (id, body) => apiClient.patch(`/career-roadmaps/${id}/progress`, body).then((r) => r.data),
  submitAssessment: (id, body) => apiClient.post(`/career-roadmaps/${id}/assessment`, body).then((r) => r.data),
  adapt: (id) => apiClient.post(`/career-roadmaps/${id}/adapt`).then((r) => r.data),
  readiness: (id) => apiClient.get(`/career-roadmaps/${id}/readiness`).then((r) => r.data),
  mentor: (id, body) => apiClient.post(`/career-roadmaps/${id}/mentor-question`, body).then((r) => r.data),
  calendar: (id, params) => apiClient.get(`/career-roadmaps/${id}/calendar`, { params }).then((r) => r.data),
  notes: (id, params) => apiClient.get(`/career-roadmaps/${id}/notes`, { params }).then((r) => r.data),
  createNote: (id, body) => apiClient.post(`/career-roadmaps/${id}/notes`, body).then((r) => r.data),
  updateNote: (id, noteId, body) => apiClient.patch(`/career-roadmaps/${id}/notes/${noteId}`, body).then((r) => r.data),
  deleteNote: (id, noteId) => apiClient.delete(`/career-roadmaps/${id}/notes/${noteId}`).then((r) => r.data),
  updateNoteRevisionStatus: (id, noteId, revisionStatus) =>
    apiClient.patch(`/career-roadmaps/${id}/notes/${noteId}/revision-status`, { revisionStatus }).then((r) => r.data),
  mentorWorkspace: (id, body) => apiClient.post(`/career-roadmaps/${id}/mentor/workspace`, body).then((r) => r.data),
  mentorWorkspaceStream: async (id, body, onChunk) => {
    const response = await fetch(`/api/career-roadmaps/${id}/mentor/workspace/stream`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok || !response.body) throw new Error("The mentor could not start a streaming lesson.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let completed;
    const consume = (raw) => {
      buffer += raw;
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";
      events.forEach((event) => {
        const data = event.split("\n").find((line) => line.startsWith("data:"))?.slice(5).trim();
        if (!data) return;
        const payload = JSON.parse(data);
        if (payload.text) onChunk?.(payload.text);
        if (payload.explanation || payload.conversationId) completed = payload;
        if (payload.message && payload.state === "error") throw new Error(payload.message);
      });
    };
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      consume(decoder.decode(value, { stream: true }));
    }
    return completed;
  },
  mentorConversations: (id) => apiClient.get(`/career-roadmaps/${id}/mentor/conversations`).then((r) => r.data),
  mentorFollowUp: (id, conversationId, body) =>
    apiClient.post(`/career-roadmaps/${id}/mentor/conversations/${conversationId}/messages`, body).then((r) => r.data),
  bookmarkMentor: (id, conversationId, bookmarked) =>
    apiClient.patch(`/career-roadmaps/${id}/mentor/conversations/${conversationId}/bookmark`, { bookmarked }).then((r) => r.data),
  saveMentorNote: (id, conversationId, body) =>
    apiClient.post(`/career-roadmaps/${id}/mentor/conversations/${conversationId}/save-note`, body).then((r) => r.data),
};

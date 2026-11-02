import { apiClient } from "./client";

export async function getTargetDashboard() {
  const res = await apiClient.get("/target/dashboard");
  return res.data;
}

export async function getTargetRealityScore() {
  const res = await apiClient.get("/target/reality-score");
  return res.data;
}

export async function getTargetAnalytics() {
  const res = await apiClient.get("/target/analytics");
  return res.data;
}

export async function getTargetTasks(date) {
  const res = await apiClient.get("/target/tasks", { params: { date } });
  return res.data;
}

export async function createTargetTask(data) {
  const res = await apiClient.post("/target/tasks", data);
  return res.data;
}

export async function updateTargetTask(id, data) {
  const res = await apiClient.patch(`/target/tasks/${id}`, data);
  return res.data;
}

export async function deleteTargetTask(id) {
  const res = await apiClient.delete(`/target/tasks/${id}`);
  return res.data;
}

export async function rescheduleTargetTask(id, newDate) {
  const res = await apiClient.post(`/target/tasks/${id}/reschedule`, { newDate });
  return res.data;
}

export async function getTargetRoutines() {
  const res = await apiClient.get("/target/routines");
  return res.data;
}

export async function createTargetRoutine(data) {
  const res = await apiClient.post("/target/routines", data);
  return res.data;
}

export async function updateTargetRoutine(id, data) {
  const res = await apiClient.patch(`/target/routines/${id}`, data);
  return res.data;
}

export async function deleteTargetRoutine(id) {
  const res = await apiClient.delete(`/target/routines/${id}`);
  return res.data;
}

export async function toggleTargetRoutine(id, date) {
  const res = await apiClient.post(`/target/routines/${id}/toggle`, { date });
  return res.data;
}

export async function getTargetExams() {
  const res = await apiClient.get("/target/exams");
  return res.data;
}

export async function createTargetExam(data) {
  const res = await apiClient.post("/target/exams", data);
  return res.data;
}

export async function updateTargetExam(id, data) {
  const res = await apiClient.patch(`/target/exams/${id}`, data);
  return res.data;
}

export async function deleteTargetExam(id) {
  const res = await apiClient.delete(`/target/exams/${id}`);
  return res.data;
}

export async function getTargetTopics(params) {
  const res = await apiClient.get("/target/topics", { params });
  return res.data;
}

export async function createTargetTopic(data) {
  const res = await apiClient.post("/target/topics", data);
  return res.data;
}

export async function updateTargetTopic(id, data) {
  const res = await apiClient.patch(`/target/topics/${id}`, data);
  return res.data;
}

export async function deleteTargetTopic(id) {
  const res = await apiClient.delete(`/target/topics/${id}`);
  return res.data;
}

export async function getTargetRevisions() {
  const res = await apiClient.get("/target/revisions");
  return res.data;
}

export async function completeTargetRevision(id, data) {
  const res = await apiClient.post(`/target/revisions/${id}/complete`, data);
  return res.data;
}

export async function getTargetNotes(params) {
  const res = await apiClient.get("/target/notes", { params });
  return res.data;
}

export async function createTargetNote(data) {
  const res = await apiClient.post("/target/notes", data);
  return res.data;
}

export async function updateTargetNote(id, data) {
  const res = await apiClient.patch(`/target/notes/${id}`, data);
  return res.data;
}

export async function deleteTargetNote(id) {
  const res = await apiClient.delete(`/target/notes/${id}`);
  return res.data;
}

export async function explainNoteSelection(data) {
  const res = await apiClient.post("/target/notes/ai/explain", data);
  return res.data;
}

export async function transformNoteContent(data) {
  const res = await apiClient.post("/target/notes/ai/transform", data);
  return res.data;
}

export async function analyzeNoteCode(data) {
  const res = await apiClient.post("/target/notes/ai/code-analysis", data);
  return res.data;
}

export async function getNoteKnowledgeGraph() {
  const res = await apiClient.get("/target/notes/graph");
  return res.data;
}

export async function getNoteLearningDNA() {
  const res = await apiClient.get("/target/notes/analytics/dna");
  return res.data;
}

export async function createDoubtRevisionTask(data) {
  const res = await apiClient.post("/target/notes/doubts/create-task", data);
  return res.data;
}

export async function getTargetDailyJournal(date) {
  const res = await apiClient.get(`/target/journal/${date}`);
  return res.data;
}

export async function saveTargetDailyJournal(data) {
  const res = await apiClient.post("/target/journal", data);
  return res.data;
}

export async function getTargetCalendar(params) {
  const res = await apiClient.get("/target/calendar", { params });
  return res.data;
}

export async function getTargetAchievements() {
  const res = await apiClient.get("/target/achievements");
  return res.data;
}

export async function getTargetRecovery() {
  const res = await apiClient.get("/target/recovery");
  return res.data;
}

export async function applyTargetRecovery(data) {
  const res = await apiClient.post("/target/recovery/action", data);
  return res.data;
}

export async function askTargetCoach(data) {
  const res = await apiClient.post("/target/coach", data);
  return res.data;
}


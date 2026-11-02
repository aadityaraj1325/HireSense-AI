import { apiClient } from "./client";

export async function getConversations() {
  const res = await apiClient.get("/chat/conversations");
  return res.data;
}

export async function createConversation(data = {}) {
  const res = await apiClient.post("/chat/conversations", data);
  return res.data;
}

export async function getConversation(id) {
  const res = await apiClient.get(`/chat/conversations/${id}`);
  return res.data;
}

export async function updateConversation(id, data) {
  const res = await apiClient.patch(`/chat/conversations/${id}`, data);
  return res.data;
}

export async function deleteConversation(id) {
  const res = await apiClient.delete(`/chat/conversations/${id}`);
  return res.data;
}

export async function sendMessage(id, message) {
  const res = await apiClient.post(`/chat/conversations/${id}/messages`, { message });
  return res.data;
}


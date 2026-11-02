import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as targetApi from "@/api/target";

// Target Dashboard & Metrics
export function useTargetDashboard() {
  return useQuery({
    queryKey: ["target", "dashboard"],
    queryFn: async () => {
      const res = await targetApi.getTargetDashboard();
      return res.data;
    },
    staleTime: 1000 * 30, // 30s
  });
}

export function useTargetRealityScore() {
  return useQuery({
    queryKey: ["target", "reality-score"],
    queryFn: async () => {
      const res = await targetApi.getTargetRealityScore();
      return res.data;
    },
    staleTime: 1000 * 60,
  });
}

export function useTargetAnalytics() {
  return useQuery({
    queryKey: ["target", "analytics"],
    queryFn: async () => {
      const res = await targetApi.getTargetAnalytics();
      return res.data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

// Tasks
export function useTargetTasks(date) {
  return useQuery({
    queryKey: ["target", "tasks", date || "today"],
    queryFn: async () => {
      const res = await targetApi.getTargetTasks(date);
      return res.data;
    },
  });
}

export function useCreateTargetTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => targetApi.createTargetTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target"] });
    },
  });
}

export function useUpdateTargetTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => targetApi.updateTargetTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target"] });
    },
  });
}

export function useDeleteTargetTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => targetApi.deleteTargetTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target"] });
    },
  });
}

export function useRescheduleTargetTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newDate }) => targetApi.rescheduleTargetTask(id, newDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target"] });
    },
  });
}

// Routines
export function useTargetRoutines() {
  return useQuery({
    queryKey: ["target", "routines"],
    queryFn: async () => {
      const res = await targetApi.getTargetRoutines();
      return res.data;
    },
  });
}

export function useCreateTargetRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => targetApi.createTargetRoutine(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target", "routines"] });
      queryClient.invalidateQueries({ queryKey: ["target", "dashboard"] });
    },
  });
}

export function useUpdateTargetRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => targetApi.updateTargetRoutine(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target", "routines"] });
      queryClient.invalidateQueries({ queryKey: ["target", "dashboard"] });
    },
  });
}

export function useDeleteTargetRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => targetApi.deleteTargetRoutine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target", "routines"] });
      queryClient.invalidateQueries({ queryKey: ["target", "dashboard"] });
    },
  });
}

export function useToggleTargetRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, date }) => targetApi.toggleTargetRoutine(id, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target", "routines"] });
      queryClient.invalidateQueries({ queryKey: ["target", "dashboard"] });
    },
  });
}

// Exams
export function useTargetExams() {
  return useQuery({
    queryKey: ["target", "exams"],
    queryFn: async () => {
      const res = await targetApi.getTargetExams();
      return res.data;
    },
  });
}

export function useCreateTargetExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => targetApi.createTargetExam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target"] });
    },
  });
}

export function useUpdateTargetExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => targetApi.updateTargetExam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target"] });
    },
  });
}

export function useDeleteTargetExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => targetApi.deleteTargetExam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target"] });
    },
  });
}

// Topics
export function useTargetTopics(params) {
  return useQuery({
    queryKey: ["target", "topics", params],
    queryFn: async () => {
      const res = await targetApi.getTargetTopics(params);
      return res.data;
    },
  });
}

export function useCreateTargetTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => targetApi.createTargetTopic(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target"] });
    },
  });
}

export function useUpdateTargetTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => targetApi.updateTargetTopic(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target"] });
    },
  });
}

export function useDeleteTargetTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => targetApi.deleteTargetTopic(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target"] });
    },
  });
}

// Revisions
export function useTargetRevisions() {
  return useQuery({
    queryKey: ["target", "revisions"],
    queryFn: async () => {
      const res = await targetApi.getTargetRevisions();
      return res.data;
    },
  });
}

export function useCompleteTargetRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => targetApi.completeTargetRevision(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target"] });
    },
  });
}

// Notes
export function useTargetNotes(params) {
  return useQuery({
    queryKey: ["target", "notes", params],
    queryFn: async () => {
      const res = await targetApi.getTargetNotes(params);
      return res.data;
    },
  });
}

export function useCreateTargetNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => targetApi.createTargetNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target", "notes"] });
    },
  });
}

export function useUpdateTargetNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => targetApi.updateTargetNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target", "notes"] });
    },
  });
}

export function useDeleteTargetNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => targetApi.deleteTargetNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target", "notes"] });
    },
  });
}

export function useExplainNoteSelection() {
  return useMutation({
    mutationFn: (data) => targetApi.explainNoteSelection(data),
  });
}

export function useTransformNoteContent() {
  return useMutation({
    mutationFn: (data) => targetApi.transformNoteContent(data),
  });
}

export function useAnalyzeNoteCode() {
  return useMutation({
    mutationFn: (data) => targetApi.analyzeNoteCode(data),
  });
}

export function useNoteKnowledgeGraph() {
  return useQuery({
    queryKey: ["target", "notes", "graph"],
    queryFn: async () => {
      const res = await targetApi.getNoteKnowledgeGraph();
      return res.data;
    },
  });
}

export function useNoteLearningDNA() {
  return useQuery({
    queryKey: ["target", "notes", "dna"],
    queryFn: async () => {
      const res = await targetApi.getNoteLearningDNA();
      return res.data;
    },
  });
}

export function useCreateDoubtRevisionTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => targetApi.createDoubtRevisionTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["target", "dashboard"] });
    },
  });
}

// Daily Journal
export function useTargetDailyJournal(date) {
  return useQuery({
    queryKey: ["target", "journal", date],
    queryFn: async () => {
      const res = await targetApi.getTargetDailyJournal(date);
      return res.data;
    },
    enabled: !!date,
  });
}

export function useSaveTargetDailyJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => targetApi.saveTargetDailyJournal(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["target", "journal", variables.date] });
      queryClient.invalidateQueries({ queryKey: ["target", "dashboard"] });
    },
  });
}

// Calendar
export function useTargetCalendar(params) {
  return useQuery({
    queryKey: ["target", "calendar", params],
    queryFn: async () => {
      const res = await targetApi.getTargetCalendar(params);
      return res.data;
    },
  });
}

// Achievements
export function useTargetAchievements() {
  return useQuery({
    queryKey: ["target", "achievements"],
    queryFn: async () => {
      const res = await targetApi.getTargetAchievements();
      return res.data;
    },
  });
}

// Recovery
export function useTargetRecovery() {
  return useQuery({
    queryKey: ["target", "recovery"],
    queryFn: async () => {
      const res = await targetApi.getTargetRecovery();
      return res.data;
    },
  });
}

export function useApplyTargetRecovery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => targetApi.applyTargetRecovery(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["target"] });
    },
  });
}

// AI Coach
export function useAskTargetCoach() {
  return useMutation({
    mutationFn: (data) => targetApi.askTargetCoach(data),
  });
}


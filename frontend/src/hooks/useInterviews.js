import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { interviewsApi } from "@/api/interviews";
import { useToast } from "@/context/UIContext";

export const interviewKeys = {
  all: ["interviews"],
  list: () => [...interviewKeys.all, "list"],
  detail: (id) => [...interviewKeys.all, "detail", id],
  studio: (id) => [...interviewKeys.all, "studio", id],
};

export function useInterviews() {
  return useQuery({
    queryKey: interviewKeys.list(),
    queryFn: () => interviewsApi.list().then((data) => data.sessions),
  });
}

export function useInterviewPerformance() {
  return useQuery({
    queryKey: [...interviewKeys.all, "performance"],
    queryFn: interviewsApi.performance,
  });
}

export function useInterview(id) {
  return useQuery({
    queryKey: interviewKeys.detail(id),
    queryFn: () => interviewsApi.get(id).then((data) => data.session),
    enabled: !!id,
  });
}

export function useCreateInterview() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: interviewsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: interviewKeys.list() }),
    onError: (error) => toast.error("Couldn't start interview", error?.message),
  });
}

export function useAnswerInterview() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, payload }) => interviewsApi.answer(id, payload),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(interviewKeys.detail(variables.id), data.session);
    },
    onError: (error) => toast.error("Couldn't evaluate answer", error?.message),
  });
}

export function useFinishInterview() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: interviewsApi.finish,
    onSuccess: (data, id) => {
      queryClient.setQueryData(interviewKeys.detail(id), data.session);
      queryClient.invalidateQueries({ queryKey: interviewKeys.list() });
      toast.success("Interview report ready", "Your revision recommendations are ready.");
    },
    onError: (error) => toast.error("Couldn't finish interview", error?.message),
  });
}

/* ==========================================================================
   Live Interview Studio Hooks
   ========================================================================== */

export function useStudioInterview(id) {
  return useQuery({
    queryKey: interviewKeys.studio(id),
    queryFn: () => interviewsApi.studioGet(id).then((d) => d.session),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
}

export function useAnalyzeJd() {
  const toast = useToast();
  return useMutation({
    mutationFn: interviewsApi.analyzeJd,
    onError: (error) => toast.error("Job analysis failed", error?.message),
  });
}

export function useInitStudio() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: interviewsApi.studioInit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: interviewKeys.list() }),
    onError: (error) => {
      const detailMsg = error?.details?.[0]
        ? `${error.details[0].field}: ${error.details[0].message}`
        : error?.message;
      toast.error("Couldn't initialize Live Studio", detailMsg || "Validation failed");
    },
  });
}

export function useStudioTurn() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, payload }) => interviewsApi.studioTurn(id, payload),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(interviewKeys.studio(variables.id), data.session);
    },
    onError: (error) => toast.error("Could not process interview turn", error?.message),
  });
}

export function useFinishStudio() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id) => interviewsApi.studioFinish(id),
    onSuccess: (data, id) => {
      queryClient.setQueryData(interviewKeys.studio(id), data.session);
      queryClient.invalidateQueries({ queryKey: interviewKeys.list() });
      toast.success("Live Interview Completed", "Comprehensive intelligence report generated.");
    },
    onError: (error) => toast.error("Could not finalize studio session", error?.message),
  });
}

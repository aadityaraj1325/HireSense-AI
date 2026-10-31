import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { careerRoadmapsApi } from "@/api/resumes";
import { useToast } from "@/context/UIContext";

export const roadmapKeys = {
  all: ["career-roadmaps"],
  list: () => [...roadmapKeys.all, "list"],
  detail: (id) => [...roadmapKeys.all, "detail", id],
};

export function useCareerRoadmaps(resumeId) {
  return useQuery({
    queryKey: [...roadmapKeys.list(), resumeId],
    queryFn: () => careerRoadmapsApi.list({ resumeId }),
    enabled: !!resumeId,
  });
}

export function useCareerRoadmap(id) {
  return useQuery({
    queryKey: roadmapKeys.detail(id),
    queryFn: () => careerRoadmapsApi.get(id),
    enabled: !!id,
  });
}

export function useCareerRoadmapByResume(resumeId) {
  return useQuery({
    queryKey: [...roadmapKeys.all, "resume", resumeId],
    queryFn: () => careerRoadmapsApi.getByResume(resumeId),
    enabled: !!resumeId,
    retry: false,
  });
}

export function useGenerateCareerRoadmap() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: careerRoadmapsApi.generate,
    onSuccess: (data) => {
      if (data?.roadmap?._id) queryClient.setQueryData(roadmapKeys.detail(data.roadmap._id), data);
      queryClient.invalidateQueries({ queryKey: roadmapKeys.all });
      toast.success("Career roadmap created", "Your personalized growth ladder is ready.");
    },
    onError: (error) => {
      const message = error?.code === "ROADMAP_REQUEST_VALIDATION_FAILED"
        ? "Check the target role and roadmap settings."
        : error?.code === "ROADMAP_VALIDATION_FAILED"
          ? "The AI returned an incomplete roadmap. Please retry; your form values are preserved."
          : error?.message;
      toast.error("Roadmap generation failed", message);
    },
  });
}

export function useUpdateRoadmapProgress(id) {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (body) => careerRoadmapsApi.updateProgress(id, body),
    onSuccess: (data) => {
      queryClient.setQueryData(roadmapKeys.detail(id), data);
      toast.success("Progress saved");
    },
    onError: (error) => toast.error("Couldn’t save progress", error?.message),
  });
}

export function useRoadmapMentor(id) {
  return useMutation({ mutationFn: (body) => careerRoadmapsApi.mentor(id, body) });
}

export function useSubmitRoadmapAssessment(id) {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (body) => careerRoadmapsApi.submitAssessment(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roadmapKeys.detail(id) });
      toast.success("Assessment submitted", "Your readiness snapshot was updated.");
    },
    onError: (error) => toast.error("Assessment failed", error?.message),
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gapIntelligenceApi } from "@/api/gapIntelligence";
import { useToast } from "@/context/UIContext";

export const gapKeys = {
  all: ["gap-intelligence"],
  latest: () => [...gapKeys.all, "latest"],
  history: () => [...gapKeys.all, "history"],
  dnaGraph: (role) => [...gapKeys.all, "dna-graph", role],
  simulationCatalog: () => [...gapKeys.all, "simulation-catalog"],
};

export function useLatestGapAnalysis() {
  return useQuery({
    queryKey: gapKeys.latest(),
    queryFn: () => gapIntelligenceApi.getLatest(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useGapHistory() {
  return useQuery({
    queryKey: gapKeys.history(),
    queryFn: () => gapIntelligenceApi.getHistory(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDnaGraph(role) {
  return useQuery({
    queryKey: gapKeys.dnaGraph(role),
    queryFn: () => gapIntelligenceApi.getDnaGraph(role),
    enabled: Boolean(role),
    staleTime: 10 * 60 * 1000,
  });
}

export function useSimulationCatalog() {
  return useQuery({
    queryKey: gapKeys.simulationCatalog(),
    queryFn: () => gapIntelligenceApi.getSimulationCatalog(),
    staleTime: 15 * 60 * 1000,
  });
}

export function useRunGapAnalysis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (body) => gapIntelligenceApi.runAnalysis(body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gapKeys.all });
      toast({
        title: "Analysis complete",
        description: `Career Gap Intelligence generated for ${data.analysis?.targetRole || "target role"}.`,
        variant: "success",
      });
    },
    onError: (err) => {
      toast({
        title: "Analysis failed",
        description: err.response?.data?.message || err.message || "Failed to analyze career gaps.",
        variant: "error",
      });
    },
  });
}

export function useSimulateActions() {
  return useMutation({
    mutationFn: (body) => gapIntelligenceApi.simulate(body),
  });
}

export function useSubmitEvidence() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (body) => gapIntelligenceApi.submitEvidence(body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gapKeys.latest() });
      toast({
        title: "Evidence verified",
        description: `Proof recorded with confidence level ${data.evidence?.confidenceLevel || 2}.`,
        variant: "success",
      });
    },
    onError: (err) => {
      toast({
        title: "Submission failed",
        description: err.response?.data?.message || err.message || "Could not verify evidence.",
        variant: "error",
      });
    },
  });
}

export function useAddGapToRoadmap() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (gapId) => gapIntelligenceApi.addToRoadmap({ gapId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-roadmaps"] });
      toast({
        title: "Added to Roadmap",
        description: "Milestone and daily tasks created on your Career Growth Ladder.",
        variant: "success",
      });
    },
    onError: (err) => {
      toast({
        title: "Action failed",
        description: err.response?.data?.message || err.message || "Could not add milestone.",
        variant: "error",
      });
    },
  });
}

export function useAskGapCopilot() {
  return useMutation({
    mutationFn: (question) => gapIntelligenceApi.askCopilot(question),
  });
}


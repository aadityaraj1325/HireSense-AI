import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { developerTrackerApi } from "@/api/developerTracker";
import { useToast } from "@/context/UIContext";

export const trackerKeys = {
  all: ["tracker"],
  profile: () => [...trackerKeys.all, "profile"],
  overview: (range, platform) => [...trackerKeys.all, "overview", range, platform],
  calendar: (platform) => [...trackerKeys.all, "calendar", platform],
  dailyHealth: (days) => [...trackerKeys.all, "daily-health", days],
  activities: (filters) => [...trackerKeys.all, "activities", filters],
  repositories: (params) => [...trackerKeys.all, "repositories", params],
  syncLogs: (platform) => [...trackerKeys.all, "sync-logs", platform],
  rateLimit: () => [...trackerKeys.all, "rate-limit"],
  focusSessions: () => [...trackerKeys.all, "focus-sessions"],
  proofOfWork: (targetRole) => [...trackerKeys.all, "proof-of-work", targetRole],
  skillIntelligence: () => [...trackerKeys.all, "skill-intelligence"],
  resumeBridge: () => [...trackerKeys.all, "resume-bridge"],
};

export function useDeveloperProfile() {
  return useQuery({
    queryKey: trackerKeys.profile(),
    queryFn: () => developerTrackerApi.getProfile(),
  });
}

export function useDeveloperOverview(range = "all", platform = "all") {
  return useQuery({
    queryKey: trackerKeys.overview(range, platform),
    queryFn: () => developerTrackerApi.getOverview({ range, platform }),
  });
}

export function useDeveloperCalendar(platform = "all") {
  return useQuery({
    queryKey: trackerKeys.calendar(platform),
    queryFn: () => developerTrackerApi.getCalendar({ platform }),
  });
}

export function useDailyHealth(days = 7) {
  return useQuery({
    queryKey: trackerKeys.dailyHealth(days),
    queryFn: () => developerTrackerApi.getDailyHealth({ days }),
  });
}

export function useDeveloperActivities(filters = {}) {
  return useQuery({
    queryKey: trackerKeys.activities(filters),
    queryFn: () => developerTrackerApi.getActivities(filters),
  });
}

export function useDeveloperRepositories(params = {}) {
  return useQuery({
    queryKey: trackerKeys.repositories(params),
    queryFn: () => developerTrackerApi.getRepositories(params),
  });
}

export function useSyncLogs(platform = "all", limit = 10) {
  return useQuery({
    queryKey: trackerKeys.syncLogs(platform),
    queryFn: () => developerTrackerApi.getSyncLogs({ platform, limit }),
  });
}

export function useRateLimit() {
  return useQuery({
    queryKey: trackerKeys.rateLimit(),
    queryFn: () => developerTrackerApi.getRateLimit(),
    staleTime: 60 * 1000,
  });
}

export function useFocusSessions() {
  return useQuery({
    queryKey: trackerKeys.focusSessions(),
    queryFn: () => developerTrackerApi.getFocusSessions(),
  });
}

export function useProofOfWork(targetRole) {
  return useQuery({
    queryKey: trackerKeys.proofOfWork(targetRole),
    queryFn: () => developerTrackerApi.getProofOfWork({ targetRole }),
  });
}

export function useSkillIntelligence() {
  return useQuery({
    queryKey: trackerKeys.skillIntelligence(),
    queryFn: () => developerTrackerApi.getSkillIntelligence(),
  });
}

export function useResumeBridge() {
  return useQuery({
    queryKey: trackerKeys.resumeBridge(),
    queryFn: () => developerTrackerApi.getResumeBridge(),
  });
}

export function useVerifyLink() {
  return useMutation({
    mutationFn: (body) => developerTrackerApi.verifyLink(body),
  });
}

export function useConnectPlatform() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (body) => developerTrackerApi.connectPlatform(body),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: trackerKeys.all });
      const name = data?.syncResult?.platform || "platform";
      if (data?.syncError) {
        toast.error("Linked with Warning", `${name} connected as @${data?.sanitizedHandle || "user"}, but sync returned: ${data?.syncError}`);
      } else {
        toast.success(
          "Platform Connected",
          `Successfully linked ${name} (@${data?.sanitizedHandle || ""}). Initial sync complete.`
        );
      }
    },
    onError: (err) => {
      toast.error("Connection Failed", err?.response?.data?.error?.message || err?.message);
    },
  });
}

export function useDisconnectPlatform() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (platform) => developerTrackerApi.disconnectPlatform(platform),
    onSuccess: (_, platform) => {
      qc.invalidateQueries({ queryKey: trackerKeys.all });
      toast.info("Platform Disconnected", `Removed ${platform} account.`);
    },
    onError: (err) => {
      toast.error("Disconnection Failed", err?.message);
    },
  });
}

export function useSyncPlatform() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (platform) => developerTrackerApi.syncPlatform(platform),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: trackerKeys.all });
      const summary = data?.result?.summary || data?.result?.stats?.lastSyncSummary || "Developer activities refreshed across platforms.";
      toast.success("Sync Complete", summary);
    },
    onError: (err) => {
      toast.error("Sync Failed", err?.response?.data?.error?.message || err?.message);
    },
  });
}

export function useUpdateDeveloperProfile() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (body) => developerTrackerApi.updateProfile(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trackerKeys.profile() });
      qc.invalidateQueries({ queryKey: trackerKeys.all });
      toast.success("Profile Updated", "Developer settings and target role updated.");
    },
    onError: (err) => {
      toast.error("Update Failed", err?.message);
    },
  });
}

export function useCreateManualActivity() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (body) => developerTrackerApi.createManualActivity(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trackerKeys.all });
      toast.success("Activity Logged", "Manual coding activity added to timeline.");
    },
    onError: (err) => {
      toast.error("Failed to Log", err?.message);
    },
  });
}

export function useSaveFocusSession() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (body) => developerTrackerApi.createFocusSession(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trackerKeys.all });
      toast.success("Session Saved", "Your focused deep work session has been recorded.");
    },
    onError: (err) => {
      toast.error("Failed to Save Session", err?.message);
    },
  });
}

export function useApplyResumeBridge() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (body) => developerTrackerApi.applyResumeBridge(body),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: trackerKeys.resumeBridge() });
      qc.invalidateQueries({ queryKey: ["resumes"] });
      toast.success(
        "Resume Version Created",
        `Created ${data?.label || "new version"} with verified developer achievement.`
      );
    },
    onError: (err) => {
      toast.error("Failed to Apply", err?.response?.data?.error?.message || err?.message);
    },
  });
}

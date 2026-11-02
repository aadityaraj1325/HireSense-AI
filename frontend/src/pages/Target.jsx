import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Target,
  Calendar,
  Repeat,
  GraduationCap,
  Layers,
  BookOpen,
  Clock,
  CalendarDays,
  Award,
  BarChart3,
  Sparkles,
} from "lucide-react";

import {
  useTargetDashboard,
  useTargetRealityScore,
  useTargetRecovery,
  useApplyTargetRecovery,
} from "@/hooks/useTarget";

import { TargetOverview } from "@/components/target/TargetOverview";
import { DailyPlanningWorkspace } from "@/components/target/DailyPlanningWorkspace";
import { RoutineBuilderWorkspace } from "@/components/target/RoutineBuilderWorkspace";
import { ExamPlannerWorkspace } from "@/components/target/ExamPlannerWorkspace";
import { RevisionCenterWorkspace } from "@/components/target/RevisionCenterWorkspace";
import { NotesJournalWorkspace } from "@/components/target/NotesJournalWorkspace";
import { DailyJournalWorkspace } from "@/components/target/DailyJournalWorkspace";
import { TargetCalendarWorkspace } from "@/components/target/TargetCalendarWorkspace";
import { GrowthMilestonesWorkspace } from "@/components/target/GrowthMilestonesWorkspace";
import { TargetAnalyticsWorkspace } from "@/components/target/TargetAnalyticsWorkspace";
import { GoalRealityScoreModal } from "@/components/target/GoalRealityScoreModal";
import { GoalRecoveryModal } from "@/components/target/GoalRecoveryModal";
import { AITargetCoachDrawer } from "@/components/target/AITargetCoachDrawer";

const TABS = [
  { id: "overview", label: "Overview", icon: Target },
  { id: "planning", label: "Daily Planner", icon: Calendar },
  { id: "routine", label: "My Routine", icon: Repeat },
  { id: "exam", label: "Exam Planner", icon: GraduationCap },
  { id: "revision", label: "Revision Center", icon: Layers },
  { id: "notes", label: "Notes & Docs", icon: BookOpen },
  { id: "journal", label: "Evening Journal", icon: Clock },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "milestones", label: "Milestones", icon: Award },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export default function TargetPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";

  const [planningDate, setPlanningDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [isRealityModalOpen, setIsRealityModalOpen] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [isCoachDrawerOpen, setIsCoachDrawerOpen] = useState(false);

  const { data: dashboard = {}, isLoading: isLoadingDashboard } = useTargetDashboard();
  const { data: realityScore = {} } = useTargetRealityScore();
  const { data: recoveryData = {} } = useTargetRecovery();
  const applyRecoveryMutation = useApplyTargetRecovery();

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const handlePlanTomorrow = () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    setPlanningDate(tomorrow);
    setSearchParams({ tab: "planning" });
  };

  const handleSelectDayFromCalendar = (dateStr) => {
    setPlanningDate(dateStr);
    setSearchParams({ tab: "planning" });
  };

  const handleApplyRecoveryAction = async (payload) => {
    await applyRecoveryMutation.mutateAsync(payload);
    setIsRecoveryModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* 1. Main Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar border-b border-[var(--border)]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] border border-[var(--border)]"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Workspace View Routing */}
      {currentTab === "overview" && (
        <TargetOverview
          dashboard={dashboard}
          realityScore={realityScore}
          recoveryData={recoveryData}
          onOpenRealityModal={() => setIsRealityModalOpen(true)}
          onOpenRecoveryModal={() => setIsRecoveryModalOpen(true)}
          onOpenCoachDrawer={() => setIsCoachDrawerOpen(true)}
          onNavigateTab={handleTabChange}
          onPlanTomorrow={handlePlanTomorrow}
        />
      )}

      {currentTab === "planning" && (
        <DailyPlanningWorkspace initialDate={planningDate} />
      )}

      {currentTab === "routine" && (
        <RoutineBuilderWorkspace />
      )}

      {currentTab === "exam" && (
        <ExamPlannerWorkspace />
      )}

      {currentTab === "revision" && (
        <RevisionCenterWorkspace />
      )}

      {currentTab === "notes" && (
        <NotesJournalWorkspace />
      )}

      {currentTab === "journal" && (
        <DailyJournalWorkspace />
      )}

      {currentTab === "calendar" && (
        <TargetCalendarWorkspace onSelectDayForPlanning={handleSelectDayFromCalendar} />
      )}

      {currentTab === "milestones" && (
        <GrowthMilestonesWorkspace />
      )}

      {currentTab === "analytics" && (
        <TargetAnalyticsWorkspace />
      )}

      {/* 3. Global Floating Modals & Drawer */}
      <GoalRealityScoreModal
        isOpen={isRealityModalOpen}
        onClose={() => setIsRealityModalOpen(false)}
        realityScore={realityScore}
      />

      <GoalRecoveryModal
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
        recoveryData={recoveryData}
        onApplyAction={handleApplyRecoveryAction}
        isApplying={applyRecoveryMutation.isPending}
      />

      <AITargetCoachDrawer
        isOpen={isCoachDrawerOpen}
        onClose={() => setIsCoachDrawerOpen(false)}
      />
    </div>
  );
}


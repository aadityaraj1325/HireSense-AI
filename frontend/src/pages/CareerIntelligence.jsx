import React, { useState, useEffect } from "react";
import { CareerReadinessHeader } from "@/components/career-intelligence/CareerReadinessHeader";
import { PersonalizedRecommendationsList } from "@/components/career-intelligence/PersonalizedRecommendationsList";
import { SkillIntelligenceMatrix } from "@/components/career-intelligence/SkillIntelligenceMatrix";
import { ResumeHealthCard } from "@/components/career-intelligence/ResumeHealthCard";
import { DeveloperActivityCard } from "@/components/career-intelligence/DeveloperActivityCard";
import { CareerGrowthTimeline } from "@/components/career-intelligence/CareerGrowthTimeline";
import { getCareerIntelligenceOverview, refreshCareerIntelligence } from "@/api/careerIntelligence";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function CareerIntelligence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCareerIntelligenceOverview();
      if (res?.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to load career intelligence overview:", err);
      setError(err?.message || "Could not retrieve career intelligence data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const res = await refreshCareerIntelligence();
      if (res?.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to refresh career intelligence:", err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-4 animate-pulse">
        <div className="h-48 rounded-3xl bg-[var(--surface-2)]" />
        <div className="h-64 rounded-3xl bg-[var(--surface-2)]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-80 rounded-3xl bg-[var(--surface-2)]" />
          <div className="h-80 rounded-3xl bg-[var(--surface-2)]" />
          <div className="h-80 rounded-3xl bg-[var(--surface-2)]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="p-3 w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-xl font-display font-bold text-[var(--ink)]">
          Could not load Career Intelligence
        </h2>
        <p className="text-sm text-[var(--ink-muted)]">{error}</p>
        <button
          onClick={fetchOverview}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--ink)] text-[var(--bg)] cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* 1. Autonomous Readiness Header & Sub-Gauges */}
      <CareerReadinessHeader
        targetRole={data?.targetRole || "Software Engineer"}
        activeResume={data?.activeResume}
        readiness={data?.readiness}
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
        generatedAt={data?.generatedAt}
      />

      {/* 2. Priority Actionable Recommendations */}
      <PersonalizedRecommendationsList
        recommendations={data?.recommendations || []}
      />

      {/* 3. Skill Intelligence & Evidence Matrix */}
      <SkillIntelligenceMatrix
        skillIntelligence={data?.skillIntelligence || {}}
      />

      {/* 4. Domain Health & Trackers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ResumeHealthCard
          resumeHealth={data?.resumeHealth || {}}
          activeResume={data?.activeResume}
        />
        <DeveloperActivityCard
          developerIntelligence={data?.developerIntelligence || {}}
        />
        <CareerGrowthTimeline
          careerGrowth={data?.careerGrowth || {}}
          activeResume={data?.activeResume}
        />
      </div>
    </div>
  );
}


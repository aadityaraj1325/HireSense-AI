import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Briefcase,
  Sliders,
  Video,
  Mic,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Step1ResumeSelection } from "./Step1ResumeSelection";
import { Step2JobDescription } from "./Step2JobDescription";
import { Step3Configuration } from "./Step3Configuration";
import { Step4DeviceSetup } from "./Step4DeviceSetup";
import { Step5VoiceTest } from "./Step5VoiceTest";
import { PreInterviewReadyScreen } from "./PreInterviewReadyScreen";
import { InterviewCountdownOverlay } from "./InterviewCountdownOverlay";
import { useInitStudio } from "@/hooks/useInterviews";
import { useLiveInterview } from "@/context/LiveInterviewContext";

const WIZARD_STEPS = [
  { id: 1, label: "Resume Selection", icon: FileText },
  { id: 2, label: "Job Description", icon: Briefcase },
  { id: 3, label: "Configuration", icon: Sliders },
  { id: 4, label: "Device Setup", icon: Video },
  { id: 5, label: "Voice Test", icon: Mic },
  { id: 6, label: "Ready Screen", icon: ShieldCheck },
];

export function InterviewSetupWizard({ resumes = [] }) {
  const navigate = useNavigate();
  const initStudio = useInitStudio();
  const { startLiveSession } = useLiveInterview();

  // Step state (1 to 6)
  const [currentStep, setCurrentStep] = useState(1);

  // Setup configuration state
  const [selectedResumeId, setSelectedResumeId] = useState(resumes[0]?._id || "");
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [isResumeConfirmed, setIsResumeConfirmed] = useState(false);

  const [targetRole, setTargetRole] = useState("Full Stack Engineer");
  const [companyName, setCompanyName] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const [jobDescription, setJobDescription] = useState("");
  const [jobAnalysis, setJobAnalysis] = useState(null);

  const [interviewType, setInterviewType] = useState("technical");
  const [difficulty, setDifficulty] = useState("adaptive");
  const [duration, setDuration] = useState(30);
  const [personality, setPersonality] = useState("professional");
  const [language, setLanguage] = useState("en-US");

  // Device & Voice readiness state
  const [deviceStatus, setDeviceStatus] = useState({
    cameraGranted: false,
    micGranted: false,
  });
  const [devicesReady, setDevicesReady] = useState(false);
  const [voiceTestPassed, setVoiceTestPassed] = useState(false);

  // Countdown overlay state
  const [showCountdown, setShowCountdown] = useState(false);
  const [createdSession, setCreatedSession] = useState(null);

  const activeResume = useMemo(() => {
    if (!resumes.length) return null;
    return resumes.find((r) => r._id === selectedResumeId) || resumes[0];
  }, [resumes, selectedResumeId]);

  // Validation per step
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return !!activeResume;
      case 2:
        return !!targetRole.trim();
      case 3:
        return true;
      case 4:
        return devicesReady;
      case 5:
        return voiceTestPassed;
      case 6:
        return true;
      default:
        return false;
    }
  }, [currentStep, activeResume, targetRole, devicesReady, voiceTestPassed]);

  // Next / Back handlers
  const handleNext = () => {
    if (currentStep < 6 && canProceed) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Launch live interview: initialize session and start 10s countdown
  const handleStartInterview = () => {
    if (!activeResume) return;

    const payload = {
      resumeId: activeResume._id,
      versionId: selectedVersionId || activeResume.currentVersionId || undefined,
      targetJob: (targetRole || activeResume.targetRole || "Software Engineer").trim(),
      jobDescription: (jobDescription || "").trim(),
      jobAnalysis: jobAnalysis || undefined,
      interviewType,
      difficulty,
      duration: Number(duration) || 30,
      interviewerPersonality: personality,
      interviewStyle: "conversational",
      technicalSkills: (activeResume.parsedData?.skills || [])
        .map((s) => (typeof s === "string" ? s : s.name))
        .filter((s) => typeof s === "string" && s.trim().length > 0)
        .slice(0, 30),
    };

    initStudio.mutate(payload, {
      onSuccess: (data) => {
        setCreatedSession(data.session);
        setShowCountdown(true);
      },
    });
  };

  // Complete countdown -> Enter live studio
  const handleCountdownFinished = useCallback(() => {
    if (createdSession) {
      startLiveSession(createdSession);
      navigate(`/interview/live/${createdSession._id}`);
    }
  }, [createdSession, startLiveSession, navigate]);

  return (
    <div className="space-y-6">
      {/* Step Tracker Header */}
      <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
        <div className="flex items-center justify-between gap-2 overflow-x-auto py-1">
          {WIZARD_STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id < currentStep) setCurrentStep(step.id);
                }}
                disabled={step.id > currentStep}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isCurrent
                    ? "bg-[var(--accent-soft)] text-[var(--accent-strong)] ring-1 ring-[var(--accent)]"
                    : isCompleted
                    ? "text-emerald-700 dark:text-emerald-400 hover:bg-[var(--surface-2)]"
                    : "text-[var(--ink-muted)] opacity-60 cursor-not-allowed"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                    isCurrent
                      ? "bg-[var(--accent)] text-white"
                      : isCompleted
                      ? "bg-emerald-500 text-white"
                      : "bg-[var(--surface-2)] text-[var(--ink-muted)]"
                  }`}
                >
                  {step.id}
                </div>
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card min-h-[500px] flex flex-col justify-between">
        <div>
          {currentStep === 1 && (
            <Step1ResumeSelection
              resumes={resumes}
              selectedResumeId={selectedResumeId}
              onSelectResumeId={setSelectedResumeId}
              selectedVersionId={selectedVersionId}
              onSelectVersionId={setSelectedVersionId}
              isConfirmed={isResumeConfirmed}
              onToggleConfirm={setIsResumeConfirmed}
            />
          )}

          {currentStep === 2 && (
            <Step2JobDescription
              targetRole={targetRole}
              onChangeTargetRole={setTargetRole}
              companyName={companyName}
              onChangeCompanyName={setCompanyName}
              experienceLevel={experienceLevel}
              onChangeExperienceLevel={setExperienceLevel}
              jobDescription={jobDescription}
              onChangeJobDescription={setJobDescription}
              jobAnalysis={jobAnalysis}
              onSetJobAnalysis={setJobAnalysis}
              activeResume={activeResume}
            />
          )}

          {currentStep === 3 && (
            <Step3Configuration
              interviewType={interviewType}
              onChangeInterviewType={setInterviewType}
              difficulty={difficulty}
              onChangeDifficulty={setDifficulty}
              duration={duration}
              onChangeDuration={setDuration}
              personality={personality}
              onChangePersonality={setPersonality}
              language={language}
              onChangeLanguage={setLanguage}
            />
          )}

          {currentStep === 4 && (
            <Step4DeviceSetup
              onDevicesReady={setDevicesReady}
              deviceStatus={deviceStatus}
              setDeviceStatus={setDeviceStatus}
            />
          )}

          {currentStep === 5 && (
            <Step5VoiceTest
              deviceStatus={deviceStatus}
              onVoiceTestPassed={setVoiceTestPassed}
              isTestComplete={voiceTestPassed}
            />
          )}

          {currentStep === 6 && (
            <PreInterviewReadyScreen
              activeResume={activeResume}
              targetRole={targetRole}
              companyName={companyName}
              interviewType={interviewType}
              difficulty={difficulty}
              duration={duration}
              personality={personality}
              onStartCountdown={handleStartInterview}
              isInitializing={initStudio.isPending}
            />
          )}
        </div>

        {/* Wizard Footer Navigation Controls (Shown on Steps 1 to 5) */}
        {currentStep < 6 && (
          <div className="pt-8 border-t border-[var(--border)] mt-8 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-1.5"
            >
              <ChevronLeft size={16} /> Back
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--ink-muted)]">
                Step {currentStep} of 6
              </span>
              <Button
                type="button"
                variant="accent"
                size="md"
                onClick={handleNext}
                disabled={!canProceed}
                className="flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 10-Second Countdown Overlay */}
      {showCountdown && (
        <InterviewCountdownOverlay
          onCountdownComplete={handleCountdownFinished}
          targetRole={targetRole}
        />
      )}
    </div>
  );
}


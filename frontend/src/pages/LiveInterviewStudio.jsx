import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  useStudioInterview,
  useStudioTurn,
  useFinishStudio,
  usePauseStudioSession,
  useResumeStudioSession,
} from "@/hooks/useInterviews";
import { useVoiceInterview } from "@/hooks/useVoiceInterview";
import { useLiveInterview } from "@/context/LiveInterviewContext";
import { InterviewMediaManager } from "@/services/interviewMediaManager";
import { VisualMonitoringService } from "@/services/visualMonitoringService";

import { LiveStudioTopBar } from "@/components/interview/LiveStudioTopBar";
import { AIInterviewerAvatar } from "@/components/interview/AIInterviewerAvatar";
import { CandidateConsole } from "@/components/interview/CandidateConsole";
import { LiveSessionSidebar } from "@/components/interview/LiveSessionSidebar";
import { ConversationTranscriptDrawer } from "@/components/interview/ConversationTranscriptDrawer";
import { LiveInterviewReportModal } from "@/components/interview/LiveInterviewReportModal";
import { FacePresenceWarningModal } from "@/components/interview/FacePresenceWarningModal";
import { InterviewCountdownOverlay } from "@/components/interview/setup/InterviewCountdownOverlay";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { BrainCircuit, AlertCircle, Volume2, VolumeX, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LiveInterviewStudio() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const { data: session, isLoading, error } = useStudioInterview(sessionId);
  const studioTurn = useStudioTurn();
  const finishStudio = useFinishStudio();
  const pauseStudio = usePauseStudioSession();
  const resumeStudio = useResumeStudioSession();
  const { startLiveSession, endLiveSession, formattedElapsed } = useLiveInterview();

  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const hasSpokenOpeningRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const voiceEngineRef = useRef(null);

  // Connection recovery listener (Phase 9 B: Smart Interview Recovery)
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Candidate Camera, Audio & Visual Monitoring State
  const [stream, setStream] = useState(null);
  const streamRef = useRef(null);
  const handleAutoSubmitRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [presenceStatus, setPresenceStatus] = useState({
    status: "detecting",
    label: "Scanning face presence...",
    confidence: 1,
  });
  const [monitoringMetrics, setMonitoringMetrics] = useState({
    facePresencePct: 100,
    totalAbsentEvents: 0,
    totalMultipleFacesEvents: 0,
    totalTabSwitches: 0,
    totalEvents: 0,
  });
  const [events, setEvents] = useState([]);
  const [candidateAudioLevel, setCandidateAudioLevel] = useState(0);

  const visualMonitorRef = useRef(null);
  const hiddenVideoRef = useRef(null);
  const cleanupAudioRef = useRef(null);

  // Turn handler for voice engine
  const handleCandidateSpeech = useCallback(
    (transcriptText, isInterruption = false) => {
      if (!transcriptText || !sessionId || isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      studioTurn.mutate(
        {
          id: sessionId,
          payload: {
            candidateMessage: transcriptText,
            isInterruption,
          },
        },
        {
          onSuccess: (data) => {
            isSubmittingRef.current = false;
            if (data.isInterviewComplete) {
              // Conclude session with visual monitoring telemetry
              const summary = visualMonitorRef.current?.getMonitoringSummary() || {};
              finishStudio.mutate(
                { id: sessionId, payload: { monitoring: summary } },
                {
                  onSuccess: () => {
                    endLiveSession();
                    setReportModalOpen(true);
                  },
                }
              );
            } else if (data.interviewerReply) {
              // Speak the AI interviewer's reply aloud
              voiceEngineRef.current?.speakAIResponse(data.interviewerReply);
            } else {
              voiceEngineRef.current?.setVoiceState("LISTENING");
              voiceEngineRef.current?.startListening();
            }
          },
          onError: () => {
            isSubmittingRef.current = false;
            voiceEngineRef.current?.setVoiceState("LISTENING");
            voiceEngineRef.current?.startListening();
          },
        }
      );
    },
    [sessionId, studioTurn, finishStudio, endLiveSession]
  );

  // Interruption handler
  const handleInterrupt = useCallback(() => {
    voiceEngineRef.current?.interruptAI();
  }, []);

  const voiceEngine = useVoiceInterview({
    onCandidateSpeechFinal: (text) => handleCandidateSpeech(text, false),
    onCandidateInterrupt: () => {
      // Interrupted
    },
    silenceThresholdMs: 3500,
  });
  voiceEngineRef.current = voiceEngine;

  const activeQuestionText =
    session?.conversationHistory?.slice().reverse().find((m) => m.role === "interviewer")?.text ||
    session?.questions?.[session?.questions?.length - 1]?.prompt ||
    "Hello! I am your AI interviewer. Let us begin.";

  const handleReplayQuestion = useCallback(() => {
    if (activeQuestionText) {
      voiceEngineRef.current?.speakAIResponse(activeQuestionText);
    }
  }, [activeQuestionText]);

  // Handle auto-submission after 3 face absence warnings
  const handleAutoSubmitDueToAbsence = useCallback(() => {
    if (isSubmittingRef.current || finishStudio.isPending) return;
    isSubmittingRef.current = true;

    voiceEngineRef.current?.stopListening();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }

    const summary = visualMonitorRef.current?.getMonitoringSummary() || {};
    finishStudio.mutate(
      { id: sessionId, payload: { monitoring: { ...summary, autoTerminated: true } } },
      {
        onSuccess: () => {
          endLiveSession();
          if (streamRef.current) {
            InterviewMediaManager.stopStream(streamRef.current);
            streamRef.current = null;
          }
          setReportModalOpen(true);
        },
      }
    );
  }, [sessionId, finishStudio, endLiveSession]);

  handleAutoSubmitRef.current = handleAutoSubmitDueToAbsence;

  // Sync session with global LiveInterviewContext
  useEffect(() => {
    if (session && session.status === "active") {
      startLiveSession(session);
    }
  }, [session, startLiveSession]);

  // Initialize candidate camera, microphone and visual proctoring monitor (Runs ONCE on mount)
  useEffect(() => {
    let isMounted = true;

    const initMediaAndMonitoring = async () => {
      try {
        const acquired = await InterviewMediaManager.acquireStream({ video: true, audio: true });
        if (!isMounted) {
          InterviewMediaManager.stopStream(acquired);
          return;
        }

        streamRef.current = acquired;
        setStream(acquired);

        // Enumerate video devices for switcher
        const { videoDevices } = await InterviewMediaManager.enumerateDevices();
        if (isMounted) setAvailableCameras(videoDevices);

        // Bind stream to hidden video for visual face presence detector
        if (hiddenVideoRef.current) {
          hiddenVideoRef.current.muted = true;
          hiddenVideoRef.current.defaultMuted = true;
          hiddenVideoRef.current.playsInline = true;
          hiddenVideoRef.current.srcObject = acquired;
          hiddenVideoRef.current.play().catch(() => {});
        }

        // Initialize and start visual monitoring service
        const monitor = new VisualMonitoringService({
          detectionIntervalMs: 600,
          absenceGracePeriodSec: 2,
          multipleGracePeriodSec: 3,
          maxWarnings: 3,
          onStatusChange: (status) => {
            if (isMounted) {
              setPresenceStatus(status);
              if (status.isTerminating) {
                handleAutoSubmitRef.current?.();
              }
            }
          },
          onEvent: (newEvent) => {
            if (isMounted) {
              setEvents((prev) => [...prev.filter((e) => e.id !== newEvent.id), newEvent]);
            }
          },
          onMetricsUpdate: (metrics) => {
            if (isMounted) setMonitoringMetrics(metrics);
          },
          onAutoSubmit: () => {
            if (isMounted) {
              handleAutoSubmitRef.current?.();
            }
          },
        });

        visualMonitorRef.current = monitor;

        if (hiddenVideoRef.current) {
          monitor.startMonitoring(hiddenVideoRef.current);
        }

        // Attach audio meter
        cleanupAudioRef.current = InterviewMediaManager.createAudioMeter(
          acquired,
          (level) => {
            if (isMounted) setCandidateAudioLevel(level);
          }
        );
      } catch (err) {
        console.warn("Camera/mic acquisition notice:", err);
      }
    };

    initMediaAndMonitoring();

    return () => {
      isMounted = false;
      if (visualMonitorRef.current) {
        visualMonitorRef.current.stopMonitoring();
      }
      if (cleanupAudioRef.current) {
        cleanupAudioRef.current();
      }
      if (streamRef.current) {
        InterviewMediaManager.stopStream(streamRef.current);
        streamRef.current = null;
      }
    };
  }, []);

  // Camera toggle handler
  const handleToggleCamera = useCallback(() => {
    const nextState = !cameraActive;
    setCameraActive(nextState);
    if (streamRef.current) {
      InterviewMediaManager.setTrackEnabled(streamRef.current, "video", nextState);
    }
    if (visualMonitorRef.current) {
      visualMonitorRef.current.setCameraActive(nextState);
    }
  }, [cameraActive]);

  // Switch camera handler
  const handleSwitchCamera = useCallback(
    async (deviceId) => {
      try {
        if (streamRef.current) {
          InterviewMediaManager.stopStream(streamRef.current);
        }
        const newStream = await InterviewMediaManager.acquireStream({
          video: true,
          audio: true,
          videoDeviceId: deviceId,
        });
        streamRef.current = newStream;
        setStream(newStream);
        if (hiddenVideoRef.current) {
          hiddenVideoRef.current.srcObject = newStream;
          hiddenVideoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.warn("Could not switch camera:", err);
      }
    },
    []
  );

  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownDismissed, setCountdownDismissed] = useState(false);

  // Check if session is freshly starting (no candidate answers yet) and trigger interactive 10-second countdown
  useEffect(() => {
    if (session && !countdownDismissed && session.status !== "completed") {
      const candidateAnswersCount = (session.conversationHistory || []).filter(
        (m) => m.role === "candidate"
      ).length;

      if (candidateAnswersCount === 0 && !hasSpokenOpeningRef.current) {
        setShowCountdown(true);
      } else if (!hasSpokenOpeningRef.current) {
        // Returning to an ongoing session
        hasSpokenOpeningRef.current = true;
        setTimeout(() => {
          voiceEngine.speakAIResponse(activeQuestionText);
        }, 500);
      }
    } else if (session?.status === "completed" && session?.detailedReport) {
      setReportModalOpen(true);
    }
  }, [session, countdownDismissed, activeQuestionText, voiceEngine]);

  const handleCountdownFinished = useCallback(() => {
    setShowCountdown(false);
    setCountdownDismissed(true);
    if (!hasSpokenOpeningRef.current) {
      hasSpokenOpeningRef.current = true;
      setTimeout(() => {
        voiceEngineRef.current?.speakAIResponse(activeQuestionText);
      }, 400);
    }
  }, [activeQuestionText]);

  const handleEndInterview = () => {
    if (
      window.confirm(
        "Are you sure you want to end this interview? We will generate your comprehensive intelligence report now."
      )
    ) {
      const summary = visualMonitorRef.current?.getMonitoringSummary() || {};
      finishStudio.mutate(
        { id: sessionId, payload: { monitoring: summary } },
        {
          onSuccess: () => {
            endLiveSession();
            if (stream) {
              InterviewMediaManager.stopStream(stream);
            }
            setReportModalOpen(true);
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="h-12 w-12 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent-strong)] animate-pulse">
          <BrainCircuit size={28} />
        </div>
        <div className="text-center">
          <h2 className="text-base font-semibold text-[var(--ink)]">Connecting to Live Studio...</h2>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            Calibrating camera feed, audio stream, and conversational intelligence
          </p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Could not load Live Studio"
        description={error?.message || "Interview session not found."}
        action={<Button variant="outline" onClick={() => navigate("/interview")}>Back to Setup</Button>}
      />
    );
  }

  return (
    <div className="relative flex flex-col min-h-[calc(100vh-100px)] max-w-7xl mx-auto py-2 space-y-4">
      {/* Off-screen rendering video element for on-device computer vision decoder */}
      <video
        ref={hiddenVideoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          width: "320px",
          height: "240px",
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {/* Offline Reconnection Alert (Phase 9 B) */}
      {!isOnline && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle size={15} className="shrink-0 text-amber-500" />
            <span>Network disconnected. Your completed answers are saved. Reconnecting...</span>
          </div>
          <span className="text-[11px] font-mono">Auto-Recovering</span>
        </div>
      )}

      {/* Top Header Controls */}
      <LiveStudioTopBar
        targetRole={session.targetJob}
        companyName={session.jobAnalysis?.companyName || "Target Company"}
        currentDifficulty={session.currentDifficulty}
        durationMinutes={session.duration || 30}
        onEndInterview={handleEndInterview}
        onToggleTranscript={() => setTranscriptOpen((prev) => !prev)}
        transcriptOpen={transcriptOpen}
        isEnding={finishStudio.isPending}
      />

      {/* Main Studio Video Interview Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
        {/* Left Section: AI Interviewer Stage, Question & Interactive Console */}
        <div
          className={`flex flex-col justify-between transition-all duration-300 ${
            transcriptOpen ? "lg:col-span-7" : "lg:col-span-8"
          } space-y-4`}
        >
          {/* Bioluminescent AI Interviewer Avatar & Central Question Card */}
          <div className="flex-1 flex flex-col items-center justify-center py-6 sm:py-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card">
            <button
              type="button"
              onClick={voiceEngine.voiceState === "AI_SPEAKING" ? handleInterrupt : handleReplayQuestion}
              title={
                voiceEngine.voiceState === "AI_SPEAKING"
                  ? "Click to Pause / Intervene"
                  : "Click to Replay Question Aloud"
              }
              className="cursor-pointer focus:outline-none transition-transform active:scale-95 group rounded-full"
            >
              <AIInterviewerAvatar
                voiceState={voiceEngine.voiceState}
                interviewerPersonality={session.interviewerPersonality || "Professional"}
                activeTopic={session.activeTopic || "Technical Background"}
              />
            </button>

            {/* Active AI Prompt / Current Spoken Turn Subtitle */}
            <div className="max-w-2xl px-6 text-center mt-2 flex flex-col items-center gap-3">
              <p className="text-sm sm:text-base font-medium text-[var(--ink)] leading-relaxed">
                {activeQuestionText}
              </p>

              {/* Audio Playback & Replay Controls */}
              <div className="flex items-center gap-2">
                {voiceEngine.voiceState === "AI_SPEAKING" ? (
                  <button
                    type="button"
                    onClick={handleInterrupt}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer animate-pulse"
                  >
                    <VolumeX size={14} />
                    <span>Skip / Pause Voice</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReplayQuestion}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[var(--surface-2)] text-[var(--accent-strong)] border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Volume2 size={15} />
                    <span>Replay Question Aloud</span>
                  </button>
                )}
              </div>

              {/* Central Stage Dynamic Turn Status / Live Candidate Transcript Box */}
              {voiceEngine.voiceState === "LISTENING" && voiceEngine.interimTranscript ? (
                <div className="w-full max-w-xl mt-3 p-4 rounded-2xl bg-[var(--surface-2)]/90 border-2 border-[var(--accent)] shadow-lg text-left space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-xs font-semibold text-[var(--accent-strong)] tracking-wide">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      YOUR SPOKEN ANSWER (LIVE TRANSCRIPT)
                    </span>
                    <span className="text-[11px] font-mono text-[var(--ink-muted)]">
                      {voiceEngine.interimTranscript.split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-[var(--ink)] font-semibold leading-relaxed break-words">
                    &ldquo;{voiceEngine.interimTranscript}&rdquo;
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-[11px] text-[var(--ink-muted)]">
                    <span>Auto-sends after 3.5s pause, or click to send:</span>
                    <button
                      type="button"
                      onClick={() => voiceEngine.commitCandidateAnswer(voiceEngine.interimTranscript)}
                      disabled={studioTurn.isPending}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--accent)] text-white hover:opacity-90 shadow-sm transition-transform active:scale-95 cursor-pointer"
                    >
                      Send Answer Now →
                    </button>
                  </div>
                </div>
              ) : voiceEngine.voiceState === "LISTENING" ? (
                <div className="w-full max-w-xl mt-3 px-4 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-center animate-in fade-in duration-300">
                  <p className="text-xs sm:text-sm font-medium text-blue-500 dark:text-blue-400 flex items-center justify-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                    Listening to you... Speak naturally into your microphone
                  </p>
                </div>
              ) : voiceEngine.voiceState === "PROCESSING" ? (
                <div className="w-full max-w-xl mt-3 px-4 py-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-center flex flex-col items-center gap-1.5 animate-pulse">
                  <div className="flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-purple-500 animate-ping" />
                    Evaluating response & formulating next question...
                  </div>
                  <p className="text-xs text-[var(--ink-muted)]">
                    Analyzing technical depth, engineering trade-offs, and practical architecture
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Candidate Action Console */}
          <div>
            <CandidateConsole
              voiceState={voiceEngine.voiceState}
              isMuted={voiceEngine.isMuted}
              audioLevel={voiceEngine.audioLevel}
              interimTranscript={voiceEngine.interimTranscript}
              answerElapsedSeconds={voiceEngine.answerElapsedSeconds}
              showTimeoutPrompt={voiceEngine.showTimeoutPrompt}
              onInterrupt={handleInterrupt}
              onToggleMute={voiceEngine.toggleMute}
              onSubmitAnswer={(text) => voiceEngine.commitCandidateAnswer(text)}
              onReplayQuestion={handleReplayQuestion}
              onPauseInterview={() => {
                if (session?._id) {
                  voiceEngine.stopListening();
                  pauseStudio.mutate(session._id);
                }
              }}
              isProcessing={studioTurn.isPending}
            />
          </div>
        </div>

        {/* Right Section: Candidate Live Camera Preview & Smart Proctoring Sidebar */}
        <div
          className={`transition-all duration-300 ${
            transcriptOpen ? "lg:col-span-5" : "lg:col-span-4"
          }`}
        >
          <LiveSessionSidebar
            stream={stream}
            cameraActive={cameraActive}
            onToggleCamera={handleToggleCamera}
            isMuted={voiceEngine.isMuted}
            onToggleMute={voiceEngine.toggleMute}
            audioLevel={candidateAudioLevel}
            presenceStatus={presenceStatus}
            availableCameras={availableCameras}
            onSwitchCamera={handleSwitchCamera}
            candidateName={session?.resumeId?.title || "Candidate"}
            monitoringMetrics={monitoringMetrics}
            events={events}
            formattedElapsed={formattedElapsed}
            activeTopic={session?.activeTopic}
            questionsCount={session?.questions?.length || 0}
            topicsCovered={session?.topicsCovered || []}
            onVideoReady={(el) => {
              if (visualMonitorRef.current) {
                visualMonitorRef.current.setVideoElement(el);
              }
            }}
          />
        </div>

        {/* Collapsible Live Conversation Transcript Drawer */}
        {transcriptOpen && (
          <div className="lg:col-span-12 h-[500px]">
            <ConversationTranscriptDrawer
              isOpen={transcriptOpen}
              onClose={() => setTranscriptOpen(false)}
              history={session.conversationHistory || []}
              activeTopic={session.activeTopic}
            />
          </div>
        )}
      </div>

      {/* Post-Interview Intelligence Report Modal */}
      {reportModalOpen && (
        <LiveInterviewReportModal
          report={session.detailedReport}
          session={session}
          onClose={() => setReportModalOpen(false)}
          onGoDashboard={() => navigate("/dashboard")}
        />
      )}

      {/* Visual Proctoring Face Absence & Neck Movement Warning Pop-up Modal */}
      <FacePresenceWarningModal
        isOpen={!!presenceStatus.isWarningActive}
        warningCount={presenceStatus.warningCount || 1}
        maxWarnings={3}
        secondsAbsent={presenceStatus.absentDurationSec || 2}
        isTerminating={!!presenceStatus.isTerminating}
        warningReason={presenceStatus.warningReason || "no_face"}
        directionLabel={presenceStatus.directionLabel || "Looking Away"}
      />

      {/* Interactive 10-Second Countdown Overlay Before Interview Starts */}
      {showCountdown && (
        <InterviewCountdownOverlay
          onCountdownComplete={handleCountdownFinished}
          targetRole={session?.targetJob || "Software Engineer"}
        />
      )}
    </div>
  );
}

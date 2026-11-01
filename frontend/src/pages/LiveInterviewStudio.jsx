import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  useStudioInterview,
  useStudioTurn,
  useFinishStudio,
} from "@/hooks/useInterviews";
import { useVoiceInterview } from "@/hooks/useVoiceInterview";
import { LiveStudioTopBar } from "@/components/interview/LiveStudioTopBar";
import { AIInterviewerAvatar } from "@/components/interview/AIInterviewerAvatar";
import { CandidateConsole } from "@/components/interview/CandidateConsole";
import { ConversationTranscriptDrawer } from "@/components/interview/ConversationTranscriptDrawer";
import { LiveInterviewReportModal } from "@/components/interview/LiveInterviewReportModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { BrainCircuit, AlertCircle, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LiveInterviewStudio() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const { data: session, isLoading, error } = useStudioInterview(sessionId);
  const studioTurn = useStudioTurn();
  const finishStudio = useFinishStudio();

  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const hasSpokenOpeningRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const voiceEngineRef = useRef(null);

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
              // Conclude session and show report
              setReportModalOpen(true);
            } else if (data.interviewerReply) {
              // Speak the AI interviewer's reply aloud (which automatically transitions to LISTENING on completion)
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
    [sessionId, studioTurn]
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

  // Speak active question once when session loads
  useEffect(() => {
    if (session && !hasSpokenOpeningRef.current && session.status !== "completed") {
      hasSpokenOpeningRef.current = true;
      setTimeout(() => {
        voiceEngine.speakAIResponse(activeQuestionText);
      }, 500);
    } else if (session?.status === "completed" && session?.detailedReport) {
      setReportModalOpen(true);
    }
  }, [session, activeQuestionText, voiceEngine]);

  const handleEndInterview = () => {
    if (window.confirm("Are you sure you want to end this interview? We will generate your comprehensive intelligence report now.")) {
      finishStudio.mutate(sessionId, {
        onSuccess: () => {
          setReportModalOpen(true);
        },
      });
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
          <p className="text-xs text-[var(--ink-muted)] mt-1">Calibrating microphone and conversational intelligence</p>
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
    <div className="relative flex flex-col min-h-[calc(100vh-120px)] max-w-6xl mx-auto py-2 space-y-4">
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

      {/* Main Studio Interactive Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-stretch">
        {/* Center Arena: Holographic AI Avatar & Active Question Context */}
        <div className={`flex flex-col justify-between transition-all duration-300 ${transcriptOpen ? "lg:col-span-8" : "lg:col-span-12"}`}>
          {/* Bioluminescent AI Interviewer Avatar */}
          <div className="flex-1 flex flex-col items-center justify-center py-6 sm:py-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
            <button
              type="button"
              onClick={voiceEngine.voiceState === "AI_SPEAKING" ? handleInterrupt : handleReplayQuestion}
              title={voiceEngine.voiceState === "AI_SPEAKING" ? "Click to Pause / Intervene" : "Click to Replay Question Aloud"}
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
                    Listening to you... Speak your answer naturally into your microphone
                  </p>
                </div>
              ) : voiceEngine.voiceState === "PROCESSING" ? (
                <div className="w-full max-w-xl mt-3 px-4 py-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-center flex flex-col items-center gap-1.5 animate-pulse">
                  <div className="flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-purple-500 animate-ping" />
                    Evaluating your response & formulating next question...
                  </div>
                  <p className="text-xs text-[var(--ink-muted)]">
                    Analyzing technical depth, engineering trade-offs, and practical architecture
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Candidate Action Console */}
          <div className="mt-4">
            <CandidateConsole
              voiceState={voiceEngine.voiceState}
              isMuted={voiceEngine.isMuted}
              audioLevel={voiceEngine.audioLevel}
              interimTranscript={voiceEngine.interimTranscript}
              onInterrupt={handleInterrupt}
              onToggleMute={voiceEngine.toggleMute}
              onSubmitAnswer={(text) => voiceEngine.commitCandidateAnswer(text)}
              isProcessing={studioTurn.isPending}
            />
          </div>
        </div>

        {/* Collapsible Live Conversation Transcript Drawer */}
        {transcriptOpen && (
          <div className="lg:col-span-4 h-[650px] sticky top-24">
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
    </div>
  );
}


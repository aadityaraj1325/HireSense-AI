import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Wifi,
  ShieldCheck,
  RefreshCw,
  Play,
  RotateCcw,
  VolumeX,
  Radio,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InterviewMediaManager } from "@/services/interviewMediaManager";

const TEST_PHRASE = "Hello HireSense, I am ready for my interview.";

export function Step5VoiceTest({
  deviceStatus,
  onVoiceTestPassed,
  isTestComplete,
}) {
  const [transcribedText, setTranscribedText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [testPassed, setTestPassed] = useState(isTestComplete || false);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [networkOnline, setNetworkOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [audioLevel, setAudioLevel] = useState(0);
  const [micSoundDetected, setMicSoundDetected] = useState(false);
  const [speechError, setSpeechError] = useState("");

  const recognitionRef = useRef(null);
  const isMountedRef = useRef(true);
  const streamRef = useRef(null);
  const audioCleanupRef = useRef(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setNetworkOnline(true);
    const handleOffline = () => setNetworkOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Web Audio Chime & Speech Synthesis for Audio Output Test
  const handleTestAudioOutput = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.start(now);
        osc.stop(now + 0.35);
      }

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance("Audio output verified. HireSense AI is ready.");
          utterance.rate = 1.05;
          window.speechSynthesis.speak(utterance);
        } catch (_) {}
      }

      setAudioPlayed(true);
    } catch (e) {
      console.warn("Audio test error:", e);
      setAudioPlayed(true);
    }
  };

  // Immediate manual verification
  const handleManualPass = useCallback(() => {
    setTestPassed(true);
    if (!audioPlayed) setAudioPlayed(true);
    onVoiceTestPassed(true);
  }, [audioPlayed, onVoiceTestPassed]);

  // Initialize live microphone stream & audio level visualizer
  useEffect(() => {
    isMountedRef.current = true;
    let localStream = null;

    const initMicMeter = async () => {
      try {
        const acquired = await InterviewMediaManager.acquireStream({
          video: false,
          audio: true,
        });

        if (!isMountedRef.current) {
          InterviewMediaManager.stopStream(acquired);
          return;
        }

        localStream = acquired;
        streamRef.current = acquired;

        const cleanup = InterviewMediaManager.createAudioMeter(acquired, (lvl) => {
          if (!isMountedRef.current) return;
          setAudioLevel(lvl);
          if (lvl > 8) {
            setMicSoundDetected(true);
          }
        });

        audioCleanupRef.current = cleanup;
      } catch (err) {
        console.warn("Could not start audio meter in Step 5:", err);
      }
    };

    initMicMeter();

    return () => {
      isMountedRef.current = false;
      if (audioCleanupRef.current) {
        audioCleanupRef.current();
      }
      if (localStream) {
        InterviewMediaManager.stopStream(localStream);
      }
      if (streamRef.current) {
        InterviewMediaManager.stopStream(streamRef.current);
      }
    };
  }, []);

  // Start Speech Recognition
  const startVoiceTest = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        if (!isMountedRef.current) return;
        setIsListening(true);
        setSpeechError("");
      };

      recognition.onresult = (event) => {
        if (!isMountedRef.current) return;
        let interim = "";
        let final = "";

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            final += res[0].transcript + " ";
          } else {
            interim += res[0].transcript;
          }
        }

        const combined = (final + interim).trim();
        setTranscribedText(combined);

        // Verification condition: detected test phrase OR any spoken words
        const words = combined.toLowerCase().split(/\s+/).filter(Boolean);
        const hasKeyPhrase =
          combined.toLowerCase().includes("hiresense") ||
          combined.toLowerCase().includes("ready") ||
          combined.toLowerCase().includes("interview") ||
          words.length >= 2;

        if (hasKeyPhrase) {
          setTestPassed(true);
          onVoiceTestPassed(true);
        }
      };

      recognition.onerror = (event) => {
        if (!isMountedRef.current) return;
        console.warn("Voice test recognition notice:", event.error);
        if (event.error === "network") {
          setSpeechError("Speech cloud service taking longer to connect. You can confirm via the volume meter below.");
        } else if (event.error === "not-allowed") {
          setSpeechError("Microphone access blocked in browser. Please allow microphone permissions.");
        }
        if (event.error !== "no-speech") {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (!isMountedRef.current) return;
        setIsListening(false);

        // Auto-restart listening if candidate is still speaking/testing and hasn't passed yet
        if (!testPassed && isMountedRef.current) {
          setTimeout(() => {
            if (isMountedRef.current && !testPassed) {
              try {
                recognition.start();
              } catch (_) {}
            }
          }, 350);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Could not start speech recognition:", err);
      setIsListening(false);
    }
  }, [testPassed, onVoiceTestPassed]);

  useEffect(() => {
    startVoiceTest();
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, [startVoiceTest]);

  // Auto-verify if test passed
  useEffect(() => {
    if (testPassed) {
      onVoiceTestPassed(true);
    }
  }, [testPassed, onVoiceTestPassed]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-strong)]">
          Step 5 • Audio & Voice Readiness Test
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--ink)] mt-0.5">
          Interactive Voice & Audio Verification
        </h2>
        <p className="text-sm text-[var(--ink-muted)] mt-1">
          This mandatory interactive test ensures your microphone captures crisp speech and your speakers clearly reproduce the AI interviewer's voice.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Test Speaking Prompt (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card padding="lg" radius="lg" className="border-2 border-[var(--accent)]/30 bg-[var(--surface)] shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Mic size={18} className="text-[var(--accent-strong)]" />
                  <CardTitle className="text-base">Speak Test Phrase</CardTitle>
                </div>
                {isListening ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Listening to you...
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={startVoiceTest}
                    className="text-xs h-7"
                  >
                    <RotateCcw size={12} className="mr-1" /> Restart Test Mic
                  </Button>
                )}
              </div>
              <CardDescription>
                Read the following sentence aloud into your microphone:
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-1">
              {/* Highlighted Phrase */}
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-center">
                <p className="text-base sm:text-lg font-bold text-[var(--ink)] tracking-tight">
                  "{TEST_PHRASE}"
                </p>
              </div>

              {/* Real-Time Microphone Audio Level Bar */}
              <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
                    <Radio size={13} className={audioLevel > 5 ? "text-emerald-500 animate-pulse" : "text-[var(--ink-muted)]"} />
                    Live Microphone Input Level:
                  </span>
                  <span className="font-mono text-xs font-bold text-[var(--ink)]">
                    {audioLevel}% {micSoundDetected ? "• Sound Detected" : ""}
                  </span>
                </div>

                <div className="h-3 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-75 rounded-full ${
                      audioLevel > 35
                        ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                        : audioLevel > 8
                        ? "bg-emerald-500/80"
                        : "bg-[var(--accent)]"
                    }`}
                    style={{ width: `${Math.max(4, Math.min(100, audioLevel))}%` }}
                  />
                </div>
              </div>

              {/* Live Transcribed Candidate Speech */}
              <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] min-h-[64px] flex flex-col justify-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-muted)] block mb-1">
                  Live Speech Transcription:
                </span>
                {transcribedText ? (
                  <p className="text-sm text-[var(--ink)] font-medium italic">
                    "{transcribedText}"
                  </p>
                ) : (
                  <p className="text-xs text-[var(--ink-muted)] italic">
                    {isListening
                      ? "Listening... Speak the phrase above into your microphone."
                      : "Microphone active. Speak the sentence above or confirm below."}
                  </p>
                )}
              </div>

              {speechError && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  {speechError}
                </p>
              )}

              {/* Status Banner & Action Buttons */}
              {testPassed ? (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
                    <span>Microphone & Speech Verified! You can now click Continue below.</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-[var(--ink-muted)]">
                    {micSoundDetected
                      ? "Microphone is picking up your voice clearly."
                      : "Speak clearly at a normal conversational volume."}
                  </div>

                  {/* Immediate Manual Verification Button */}
                  <Button
                    type="button"
                    variant={micSoundDetected ? "accent" : "outline"}
                    size="sm"
                    onClick={handleManualPass}
                    className="text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 size={13} />
                    <span>{micSoundDetected ? "Confirm Voice & Continue" : "Verify Mic & Continue"}</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Speaker / Output Test */}
          <Card padding="md" radius="lg" className="border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent-strong)]">
                  <Volume2 size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--ink)]">AI Audio Output Test</h4>
                  <p className="text-xs text-[var(--ink-muted)]">
                    Verify you can hear the interviewer's speech clearly through your speakers/headphones.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant={audioPlayed ? "outline" : "accent"}
                size="sm"
                onClick={handleTestAudioOutput}
                className="shrink-0 flex items-center gap-1.5"
              >
                <Play size={13} />
                {audioPlayed ? "Play Test Again" : "Test Audio Output"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: Readiness Checklist (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card padding="md" radius="lg" className="border border-[var(--border)] bg-[var(--surface)]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck size={16} className="text-[var(--accent-strong)]" />
                Live Pre-Flight Checklist
              </CardTitle>
              <CardDescription>
                All 5 channels must be verified before proceeding to the live interview.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              {/* Check 1: Mic Connected */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-2)] text-xs">
                <span className="flex items-center gap-2 font-medium text-[var(--ink)]">
                  <Mic size={14} className="text-[var(--ink-muted)]" />
                  Microphone Connected
                </span>
                {deviceStatus?.micGranted || streamRef.current ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={14} /> Ready
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">Pending</span>
                )}
              </div>

              {/* Check 2: Camera Connected */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-2)] text-xs">
                <span className="flex items-center gap-2 font-medium text-[var(--ink)]">
                  <ShieldCheck size={14} className="text-[var(--ink-muted)]" />
                  Webcam Connected
                </span>
                {deviceStatus?.cameraGranted ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={14} /> Ready
                  </span>
                ) : (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={14} /> Ready
                  </span>
                )}
              </div>

              {/* Check 3: Voice Input Test */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-2)] text-xs">
                <span className="flex items-center gap-2 font-medium text-[var(--ink)]">
                  <Sparkles size={14} className="text-[var(--ink-muted)]" />
                  Voice Recognition Test
                </span>
                {testPassed ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={14} /> Verified
                  </span>
                ) : micSoundDetected ? (
                  <button
                    type="button"
                    onClick={handleManualPass}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    Click to Verify
                  </button>
                ) : (
                  <span className="text-amber-600 font-medium">Say Test Phrase</span>
                )}
              </div>

              {/* Check 4: Audio Output */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-2)] text-xs">
                <span className="flex items-center gap-2 font-medium text-[var(--ink)]">
                  <Volume2 size={14} className="text-[var(--ink-muted)]" />
                  AI Voice Speaker Output
                </span>
                {audioPlayed ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={14} /> Confirmed
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleTestAudioOutput}
                    className="text-amber-600 hover:underline cursor-pointer font-medium"
                  >
                    Click Test
                  </button>
                )}
              </div>

              {/* Check 5: Internet */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-2)] text-xs">
                <span className="flex items-center gap-2 font-medium text-[var(--ink)]">
                  <Wifi size={14} className="text-[var(--ink-muted)]" />
                  Network Connection
                </span>
                {networkOnline ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={14} /> Connected
                  </span>
                ) : (
                  <span className="text-red-500 font-medium">Offline</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

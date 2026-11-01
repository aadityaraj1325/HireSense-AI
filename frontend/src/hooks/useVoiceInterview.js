import { useState, useEffect, useRef, useCallback } from "react";

// Web Audio Context helper for notification tones (No microphone capture to avoid hardware locks)
let globalAudioCtx = null;
function getSharedAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!globalAudioCtx || globalAudioCtx.state === "closed") {
    try {
      globalAudioCtx = new AudioCtx();
    } catch (_) {}
  }
  return globalAudioCtx;
}

/**
 * Audio Chime helper using Web Audio API (Zero latency, synthesized bell tone)
 */
function playAudioChime(type = "listening") {
  const audioCtx = getSharedAudioContext();
  if (!audioCtx) return;
  try {
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === "listening") {
      // Pleasant rising chime (C5 to E5): signals "Interviewer finished, mic is now live"
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === "processing") {
      // Subtle confirmation blip
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (_) {}
}

/**
 * Splits continuous text into natural sentence-sized units for Chrome SAPI.
 * Avoids Chrome's 200-character buffer bug and allows immediate instant playback.
 */
function splitTextIntoSentences(text) {
  if (!text) return [];
  const cleaned = text
    .replace(/[*_#`~[\]]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return [];

  // Match sentences ending in punctuation
  const matches = cleaned.match(/[^.!?]+[.!?]+(?:\s|$)/g);
  if (!matches || matches.length === 0) {
    return [cleaned];
  }
  return matches.map((s) => s.trim()).filter((s) => s.length > 0);
}

/**
 * Robust voice selector that prioritizes local offline SAPI voices on Windows.
 * This prevents remote cloud socket disconnects (e.g. Google US English network drops).
 */
function pickBestVoice(voices, preference = "en-US") {
  if (!voices || voices.length === 0) return null;

  const english = voices.filter(
    (v) => v.lang && (v.lang.startsWith("en") || v.lang.includes("en-"))
  );
  const pool = english.length > 0 ? english : voices;

  // 1. Prefer local system voices (e.g. Microsoft David, Microsoft Zira, Microsoft Mark)
  const localVoice =
    pool.find(
      (v) =>
        v.localService === true &&
        /david|zira|mark|natural|neural|desktop|jenny|guy/i.test(v.name)
    ) || pool.find((v) => v.localService === true);

  if (localVoice) return localVoice;

  // 2. High-quality natural/neural voice if available
  const naturalVoice = pool.find((v) => /natural|neural/i.test(v.name));
  if (naturalVoice) return naturalVoice;

  // 3. Any English voice matching preference
  const prefVoice =
    pool.find((v) => v.lang.toLowerCase() === preference.toLowerCase()) ||
    pool.find((v) => v.lang.startsWith("en"));

  return prefVoice || pool[0] || null;
}

/**
 * Production-Grade Voice Engine for Live Interview Studio
 *
 * Architecture:
 * - Singleton SpeechRecognition instance managed across conversation turns
 * - Speech Activity Detection (VAD) with 3.5-second silence timer
 * - Resumable Speech Accumulator: user can pause 1-2 seconds, continue speaking, and chunks merge seamlessly
 * - Sentence-Chunked SpeechSynthesis: bypasses Chrome buffer limits with offline SAPI prioritization
 * - Web Audio API Analyser for real-time acoustic visualizer
 */
export function useVoiceInterview({
  onCandidateSpeechFinal,
  onCandidateInterrupt,
  voicePreference = "en-US",
  autoListenAfterAI = true,
  silenceThresholdMs = 3500, // 3.5s of continuous silence before auto-submitting
}) {
  const [voiceState, setVoiceState] = useState("INITIALIZING"); // "INITIALIZING" | "AI_SPEAKING" | "LISTENING" | "PROCESSING" | "INTERRUPTED" | "WAITING_FOR_RESPONSE"
  const [isMuted, setIsMuted] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const [permissionError, setPermissionError] = useState(null);

  // Core references
  const voiceStateRef = useRef("INITIALIZING");
  voiceStateRef.current = voiceState;

  const isMutedRef = useRef(false);
  isMutedRef.current = isMuted;

  const recognitionRef = useRef(null);
  const synthRef = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);

  // State management flags
  const shouldBeListeningRef = useRef(false);
  const isRecognizingRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const safetySpeechTimerRef = useRef(null);
  const speechResumeIntervalRef = useRef(null);

  // Voice synthesis stability trackers
  const voicesListRef = useRef([]);
  const speechSessionIdRef = useRef(0);
  const isExplicitlyCancelledRef = useRef(false);

  // Transcript accumulator across speech recognition sessions
  const accumulatedHistoryRef = useRef("");
  const lastSpokenTranscriptRef = useRef("");

  // Sync available voices (asynchronously populated by Chrome)
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const syncVoices = () => {
      try {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          voicesListRef.current = v;
        }
      } catch (_) {}
    };

    syncVoices();
    window.speechSynthesis.onvoiceschanged = syncVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition || !window.speechSynthesis) {
      setIsSupported(false);
      setVoiceState("FAILED");
      setPermissionError("Voice interview requires Google Chrome, Edge, or a Web Speech compatible browser.");
    } else {
      setIsSupported(true);
      setVoiceState("CONNECTING");
    }
  }, []);

  // Stop listening cleanly
  const stopListening = useCallback(() => {
    shouldBeListeningRef.current = false;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onsoundstart = null;
        recognitionRef.current.onspeechstart = null;
        recognitionRef.current.onspeechend = null;
        recognitionRef.current.onsoundend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }
    isRecognizingRef.current = false;
    setMicActive(false);
    setAudioLevel(0);
  }, []);

  // Commit candidate answer and transmit to backend
  const commitCandidateAnswer = useCallback(
    (explicitText) => {
      if (isSubmittingRef.current) return;

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      const textToSend = (
        explicitText ||
        lastSpokenTranscriptRef.current ||
        accumulatedHistoryRef.current ||
        interimTranscript ||
        ""
      ).trim();

      if (!textToSend || textToSend.length < 2) return;

      isSubmittingRef.current = true;
      stopListening();

      // Play soft blip chime to signal audio submission
      playAudioChime("processing");

      setVoiceState("PROCESSING");
      voiceStateRef.current = "PROCESSING";
      setInterimTranscript("");

      accumulatedHistoryRef.current = "";
      lastSpokenTranscriptRef.current = "";

      if (onCandidateSpeechFinal) {
        onCandidateSpeechFinal(textToSend);
      }
    },
    [interimTranscript, onCandidateSpeechFinal, stopListening]
  );

  // Launch a fresh SpeechRecognition session (auto-chained across pauses)
  const launchRecognitionSession = useCallback(() => {
    if (!shouldBeListeningRef.current || isSubmittingRef.current || isMutedRef.current) {
      return;
    }

    // Clean up any stale recognition instance completely
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onsoundstart = null;
        recognitionRef.current.onspeechstart = null;
        recognitionRef.current.onspeechend = null;
        recognitionRef.current.onsoundend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }

    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    const browserLang = typeof navigator !== "undefined" ? navigator.language : null;
    const preferredLang = voicePreference || browserLang || "en-US";
    recognition.lang = preferredLang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (!shouldBeListeningRef.current) {
        try { recognition.abort(); } catch (_) {}
        return;
      }
      isRecognizingRef.current = true;
      setMicActive(true);
      setVoiceState("LISTENING");
      voiceStateRef.current = "LISTENING";
      console.log("[LiveVoice] Speech recognition live & listening in:", preferredLang);
    };

    recognition.onsoundstart = () => {
      setAudioLevel(45);
    };

    recognition.onspeechstart = () => {
      setAudioLevel(75);
    };

    recognition.onspeechend = () => {
      setAudioLevel(12);
    };

    recognition.onsoundend = () => {
      setAudioLevel(0);
    };

    recognition.onresult = (event) => {
      if (!shouldBeListeningRef.current) return;

      let currentSessionFinal = "";
      let currentSessionInterim = "";

      for (let i = 0; i < event.results.length; ++i) {
        const item = event.results[i];
        const text = item[0]?.transcript || "";
        if (item.isFinal) {
          currentSessionFinal += text + " ";
        } else {
          currentSessionInterim += text;
        }
      }

      const combinedText = (
        accumulatedHistoryRef.current + " " + currentSessionFinal + " " + currentSessionInterim
      ).replace(/\s+/g, " ").trim();

      if (combinedText) {
        lastSpokenTranscriptRef.current = combinedText;
        setInterimTranscript(combinedText);
        setAudioLevel(85);

        // Reset silence countdown timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        // Auto-submit after 3.5s of continuous silence
        if (combinedText.length > 3) {
          silenceTimerRef.current = setTimeout(() => {
            if (
              shouldBeListeningRef.current &&
              !isSubmittingRef.current &&
              voiceStateRef.current === "LISTENING"
            ) {
              const toSubmit = lastSpokenTranscriptRef.current;
              if (toSubmit && toSubmit.length > 2) {
                console.log("[LiveVoice] Auto-submitting after pause:", toSubmit);
                commitCandidateAnswer(toSubmit);
              }
            }
          }, silenceThresholdMs);
        }
      }
    };

    recognition.onerror = (event) => {
      console.warn("[LiveVoice] Speech recognition error event:", event.error);
      if (event.error === "no-speech") return;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setPermissionError("Microphone permission was denied. Please allow mic access in your browser.");
      }
    };

    recognition.onend = () => {
      isRecognizingRef.current = false;
      setMicActive(false);
      setAudioLevel(0);

      if (lastSpokenTranscriptRef.current) {
        accumulatedHistoryRef.current = lastSpokenTranscriptRef.current;
      }

      // Automatically chain fresh session if we are still in listening mode
      if (
        shouldBeListeningRef.current &&
        !isMutedRef.current &&
        !isSubmittingRef.current &&
        voiceStateRef.current === "LISTENING"
      ) {
        setTimeout(() => {
          if (
            shouldBeListeningRef.current &&
            !isSubmittingRef.current &&
            voiceStateRef.current === "LISTENING"
          ) {
            launchRecognitionSession();
          }
        }, 80);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      if (err.name !== "InvalidStateError") {
        console.warn("[LiveVoice] Recognition start notice:", err.message);
      }
    }
  }, [voicePreference, silenceThresholdMs, commitCandidateAnswer]);

  // Interrupt AI immediately
  const interruptAI = useCallback(() => {
    isExplicitlyCancelledRef.current = true;
    speechSessionIdRef.current++;

    if (synthRef.current) {
      try {
        synthRef.current.cancel();
      } catch (_) {}
    }
    if (safetySpeechTimerRef.current) {
      clearTimeout(safetySpeechTimerRef.current);
      safetySpeechTimerRef.current = null;
    }
    if (speechResumeIntervalRef.current) {
      clearInterval(speechResumeIntervalRef.current);
      speechResumeIntervalRef.current = null;
    }

    setVoiceState("INTERRUPTED");
    voiceStateRef.current = "INTERRUPTED";

    if (onCandidateInterrupt) onCandidateInterrupt();

    setTimeout(() => {
      startListening();
    }, 200);
  }, [onCandidateInterrupt]);

  // Start listening to candidate
  const startListening = useCallback(() => {
    shouldBeListeningRef.current = true;
    isSubmittingRef.current = false;

    // Reset turn accumulators
    accumulatedHistoryRef.current = "";
    lastSpokenTranscriptRef.current = "";
    setInterimTranscript("");

    setVoiceState("LISTENING");
    voiceStateRef.current = "LISTENING";

    if (isMutedRef.current) return;

    // Small 80ms delay before start to let Windows audio device transition from TTS output to mic input
    setTimeout(() => {
      if (shouldBeListeningRef.current && !isSubmittingRef.current) {
        launchRecognitionSession();
      }
    }, 80);
  }, [launchRecognitionSession]);

  // Speak AI text aloud and automatically transition to LISTENING
  const speakAIResponse = useCallback(
    (text, onComplete) => {
      // 1. Immediately abort microphone while AI speaks to prevent audio echo loops
      stopListening();

      if (!synthRef.current || !text) {
        if (onComplete) onComplete();
        if (autoListenAfterAI) {
          setTimeout(() => {
            playAudioChime("listening");
            startListening();
          }, 300);
        }
        return;
      }

      // Invalidate any ongoing speech session and reset user cancel flag
      const sessionId = ++speechSessionIdRef.current;
      isExplicitlyCancelledRef.current = false;

      // Clear existing safety and resume intervals
      if (safetySpeechTimerRef.current) {
        clearTimeout(safetySpeechTimerRef.current);
        safetySpeechTimerRef.current = null;
      }
      if (speechResumeIntervalRef.current) {
        clearInterval(speechResumeIntervalRef.current);
        speechResumeIntervalRef.current = null;
      }

      // Cancel previous speech if active
      try {
        if (synthRef.current.speaking || synthRef.current.pending) {
          synthRef.current.cancel();
        }
      } catch (_) {}

      // Split text into natural, bite-sized sentence chunks
      const sentences = splitTextIntoSentences(text);
      if (sentences.length === 0) {
        if (onComplete) onComplete();
        return;
      }

      // Small 90ms debounce to allow Windows SAPI audio cancel to flush cleanly
      setTimeout(() => {
        if (speechSessionIdRef.current !== sessionId || isExplicitlyCancelledRef.current) {
          return;
        }

        try {
          if (synthRef.current.paused) {
            synthRef.current.resume();
          }

          if (typeof window !== "undefined" && !window.__hireSenseUtterances) {
            window.__hireSenseUtterances = new Set();
          }

          let currentSentenceIndex = 0;
          let retryCountForChunk = 0;
          let hasConcluded = false;
          let chunkWatchdog = null;
          let finalChunkStarted = false;

          const concludeSpeech = () => {
            if (hasConcluded) return;
            hasConcluded = true;

            if (chunkWatchdog) {
              clearTimeout(chunkWatchdog);
              chunkWatchdog = null;
            }
            if (safetySpeechTimerRef.current) {
              clearTimeout(safetySpeechTimerRef.current);
              safetySpeechTimerRef.current = null;
            }
            if (speechResumeIntervalRef.current) {
              clearInterval(speechResumeIntervalRef.current);
              speechResumeIntervalRef.current = null;
            }

            // Immediately switch UI state to LISTENING (instant feedback)
            setVoiceState("LISTENING");
            voiceStateRef.current = "LISTENING";

            if (onComplete) onComplete();

            // Transition to listening mode with auditory bell cue
            if (autoListenAfterAI) {
              playAudioChime("listening");
              startListening();
            } else {
              setVoiceState("WAITING_FOR_RESPONSE");
              voiceStateRef.current = "WAITING_FOR_RESPONSE";
            }
          };

          const speakSentenceChunk = (index) => {
            if (
              speechSessionIdRef.current !== sessionId ||
              isExplicitlyCancelledRef.current ||
              hasConcluded
            ) {
              return;
            }

            // If all sentences have completed, conclude!
            if (index >= sentences.length) {
              concludeSpeech();
              return;
            }

            currentSentenceIndex = index;
            if (index === sentences.length - 1) {
              finalChunkStarted = true;
            }

            if (chunkWatchdog) {
              clearTimeout(chunkWatchdog);
              chunkWatchdog = null;
            }

            const chunkText = sentences[index];
            const utterance = new SpeechSynthesisUtterance(chunkText);

            // Select local high-quality voice
            const voices =
              voicesListRef.current.length > 0
                ? voicesListRef.current
                : synthRef.current.getVoices();

            const selectedVoice = pickBestVoice(voices, voicePreference);
            if (selectedVoice && retryCountForChunk === 0) {
              utterance.voice = selectedVoice;
            } else {
              // System default voice fallback
              utterance.voice = null;
            }

            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            if (typeof window !== "undefined" && window.__hireSenseUtterances) {
              window.__hireSenseUtterances.add(utterance);
            }

            utterance.onstart = () => {
              if (speechSessionIdRef.current === sessionId && !hasConcluded) {
                setVoiceState("AI_SPEAKING");
                voiceStateRef.current = "AI_SPEAKING";
              }
            };

            const releaseUtterance = () => {
              if (chunkWatchdog) {
                clearTimeout(chunkWatchdog);
                chunkWatchdog = null;
              }
              if (typeof window !== "undefined" && window.__hireSenseUtterances) {
                window.__hireSenseUtterances.delete(utterance);
              }
            };

            const advanceToNext = () => {
              releaseUtterance();
              if (
                speechSessionIdRef.current !== sessionId ||
                isExplicitlyCancelledRef.current ||
                hasConcluded
              ) {
                return;
              }
              retryCountForChunk = 0;
              const nextIndex = index + 1;

              if (nextIndex < sentences.length) {
                // Natural breath pause (60ms) between sentences
                setTimeout(() => {
                  speakSentenceChunk(nextIndex);
                }, 60);
              } else {
                // ALL sentences are finished!
                concludeSpeech();
              }
            };

            utterance.onend = () => {
              advanceToNext();
            };

            utterance.onerror = (e) => {
              releaseUtterance();
              const err = e?.error;
              console.warn("Speech synthesis chunk notice:", err, "index:", index);

              if (
                isExplicitlyCancelledRef.current ||
                speechSessionIdRef.current !== sessionId ||
                hasConcluded
              ) {
                return;
              }

              if (retryCountForChunk === 0) {
                retryCountForChunk = 1;
                setTimeout(() => {
                  if (
                    speechSessionIdRef.current === sessionId &&
                    !isExplicitlyCancelledRef.current &&
                    !hasConcluded
                  ) {
                    speakSentenceChunk(index);
                  }
                }, 80);
              } else {
                retryCountForChunk = 0;
                advanceToNext();
              }
            };

            // Per-chunk watchdog: only fires if this chunk takes excessively long
            const wordsInChunk = chunkText.split(/\s+/).length;
            const maxChunkDurationMs = Math.max(3500, (wordsInChunk / 1.3) * 1000 + 3000);
            chunkWatchdog = setTimeout(() => {
              if (!hasConcluded && speechSessionIdRef.current === sessionId) {
                console.log(`Chunk ${index} advanced by watchdog`);
                advanceToNext();
              }
            }, maxChunkDurationMs);

            synthRef.current.speak(utterance);
          };

          // Begin with first sentence chunk
          speakSentenceChunk(0);

          // Resume monitor: only unpauses stalled audio; NEVER concludes speech early!
          speechResumeIntervalRef.current = setInterval(() => {
            if (
              speechSessionIdRef.current !== sessionId ||
              isExplicitlyCancelledRef.current ||
              hasConcluded
            ) {
              if (speechResumeIntervalRef.current) {
                clearInterval(speechResumeIntervalRef.current);
                speechResumeIntervalRef.current = null;
              }
              return;
            }

            if (synthRef.current?.speaking && synthRef.current?.paused) {
              synthRef.current.resume();
            }

            // ONLY if the FINAL chunk has started AND the audio has completely stopped:
            if (
              finalChunkStarted &&
              currentSentenceIndex >= sentences.length - 1 &&
              !synthRef.current?.speaking &&
              !synthRef.current?.pending
            ) {
              console.log("Final chunk speech completed via audio engine monitor");
              concludeSpeech();
            }
          }, 200);

          // Total safety timeout for entire speech
          const totalWords = text.split(/\s+/).length;
          const safetyMs = Math.max(8000, totalWords * 800 + 4000);
          safetySpeechTimerRef.current = setTimeout(() => {
            if (
              speechSessionIdRef.current === sessionId &&
              voiceStateRef.current === "AI_SPEAKING" &&
              !hasConcluded
            ) {
              try { synthRef.current?.cancel(); } catch (_) {}
              concludeSpeech();
            }
          }, safetyMs);

        } catch (err) {
          console.error("Speech synthesis invocation error:", err);
          setVoiceState("LISTENING");
          voiceStateRef.current = "LISTENING";
          startListening();
        }
      }, 90);
    },
    [autoListenAfterAI, startListening, stopListening, voicePreference]
  );

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      if (next) {
        stopListening();
        setVoiceState("WAITING_FOR_RESPONSE");
        voiceStateRef.current = "WAITING_FOR_RESPONSE";
      } else {
        startListening();
      }
      return next;
    });
  }, [startListening, stopListening]);

  return {
    voiceState,
    setVoiceState,
    isMuted,
    micActive,
    toggleMute,
    audioLevel,
    interimTranscript,
    setInterimTranscript,
    isSupported,
    permissionError,
    startListening,
    stopListening,
    speakAIResponse,
    interruptAI,
    commitCandidateAnswer,
  };
}

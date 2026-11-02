import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  X,
  Clock,
  CheckCircle2,
  Check,
  Award,
  Sparkles,
  ArrowRight,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LearningModeView({
  docTitle,
  docContent,
  onExitLearningMode,
  onSaveSession,
}) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [understoodSections, setUnderstoodSections] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [feedback, setFeedback] = useState({
    understood: "",
    difficult: "",
    needsRevision: "",
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Parse HTML headings from docContent for table of contents
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = docContent || "";
  const headingElements = Array.from(tempDiv.querySelectorAll("h1, h2, h3"));
  const headings = headingElements.map((el, i) => ({
    id: `heading_${i}`,
    text: el.innerText.trim(),
    tag: el.tagName.toLowerCase(),
  }));

  const totalHeadings = Math.max(1, headings.length);
  const understoodCount = Object.keys(understoodSections).filter((k) => understoodSections[k]).length;
  const progressPct = Math.round((understoodCount / totalHeadings) * 100);

  const toggleUnderstood = (id) => {
    setUnderstoodSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleFinishSession = () => {
    onSaveSession({
      durationSeconds: secondsElapsed,
      sectionsUnderstood: Object.keys(understoodSections).filter((k) => understoodSections[k]),
      feedback,
      completedAt: new Date(),
    });
    onExitLearningMode();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0d0f14] text-gray-100 flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Top Learning Navigation Bar */}
      <div className="px-6 py-3.5 border-b border-gray-800 bg-[#12151c]/90 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <BookOpen size={16} />
          </div>
          <div>
            <div className="text-xs uppercase font-bold tracking-wider text-amber-500">
              Distraction-Free Learning Mode
            </div>
            <h2 className="font-display font-bold text-sm text-white truncate max-w-md">
              {docTitle || "Untitled Study Document"}
            </h2>
          </div>
        </div>

        {/* Live Timer & Progress */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-800/80 border border-gray-700 font-mono text-xs text-amber-400">
            <Clock size={13} />
            <span>{formatTime(secondsElapsed)}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-gray-400">Comprehension:</span>
            <span className="font-bold text-emerald-400">{progressPct}%</span>
            <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <Button
            onClick={() => setShowReviewModal(true)}
            className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
          >
            Finish Session
          </Button>

          <button
            onClick={onExitLearningMode}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white"
            title="Exit Learning Mode"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Reading Canvas & Table of Contents */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-10 max-w-6xl mx-auto w-full overflow-y-auto">
        {/* Table of Contents & Section Progress Check (4 Cols) */}
        <div className="hidden lg:block lg:col-span-4 space-y-4 shrink-0">
          <div className="sticky top-4 p-5 rounded-3xl bg-[#151922] border border-gray-800 space-y-3">
            <div className="font-bold text-xs uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <List size={14} className="text-amber-500" />
              <span>Section Comprehension</span>
            </div>

            <p className="text-[11px] text-gray-400">
              Check off sections as you master each concept:
            </p>

            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
              {headings.length === 0 ? (
                <div className="p-3 rounded-xl bg-gray-800/40 text-xs text-gray-400">
                  Read through document text below.
                </div>
              ) : (
                headings.map((h, i) => {
                  const isDone = !!understoodSections[h.id];
                  return (
                    <div
                      key={h.id}
                      onClick={() => toggleUnderstood(h.id)}
                      className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                        isDone
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold"
                          : "bg-gray-800/40 border-gray-700/60 text-gray-300 hover:border-gray-600"
                      }`}
                    >
                      <span className="truncate pr-2">{h.text}</span>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isDone
                            ? "bg-emerald-500 border-emerald-400 text-black"
                            : "border-gray-600"
                        }`}
                      >
                        {isDone && <Check size={11} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Clean Reading Area (8 Cols) */}
        <div className="lg:col-span-8 p-6 sm:p-10 rounded-3xl bg-[#151922] border border-gray-800 shadow-2xl">
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white mb-6 border-b border-gray-800 pb-4">
            {docTitle || "Untitled Study Document"}
          </h1>

          <div
            className="prose prose-invert max-w-none text-gray-200 text-sm leading-relaxed space-y-4 font-sans"
            dangerouslySetInnerHTML={{ __html: docContent }}
          />

          <div className="mt-12 pt-6 border-t border-gray-800 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              End of document • {formatTime(secondsElapsed)} studied
            </span>
            <Button
              onClick={() => setShowReviewModal(true)}
              className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
            >
              Log Comprehension Review
            </Button>
          </div>
        </div>
      </div>

      {/* Completion Comprehension Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-gray-700 bg-[#161a24] p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-emerald-400" />
                <h3 className="font-display font-bold text-sm text-white">
                  Learning Session Summary
                </h3>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-gray-800/60 border border-gray-700 text-center">
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400">Time Studied</div>
                <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
                  {formatTime(secondsElapsed)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400">Sections Mastered</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  {understoodCount} / {totalHeadings} ({progressPct}%)
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                  1. What core concept did you understand best today?
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3-way handshake SYN, SYN-ACK, ACK sequence"
                  value={feedback.understood}
                  onChange={(e) => setFeedback({ ...feedback, understood: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                  2. What was difficult or needs an extra code example?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fast retransmit and TCP Reno congestion window reduction"
                  value={feedback.difficult}
                  onChange={(e) => setFeedback({ ...feedback, difficult: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                  3. Which subtopics should be added to tomorrow's revision agenda?
                </label>
                <input
                  type="text"
                  placeholder="e.g. CIDR prefix calculation"
                  value={feedback.needsRevision}
                  onChange={(e) => setFeedback({ ...feedback, needsRevision: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-800 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReviewModal(false)} className="rounded-xl text-xs">
                Back to Reading
              </Button>
              <Button
                onClick={handleFinishSession}
                className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
              >
                Save Learning Session
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


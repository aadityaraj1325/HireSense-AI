import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  RotateCw,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Calendar,
  Award,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function FlashcardStudioView({
  flashcards = [],
  currentDocTitle = "",
  onAddFlashcard,
  onUpdateFlashcard,
  onDeleteFlashcard,
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCard, setNewCard] = useState({
    front: "",
    back: "",
    type: "q_and_a",
    difficulty: "medium",
  });

  const activeCard = flashcards[currentIndex] || flashcards[0];

  const handleRate = (rating, intervalDays) => {
    if (!activeCard) return;
    const nextDate = new Date(Date.now() + intervalDays * 86400000);
    onUpdateFlashcard(activeCard.id, {
      confidenceRating: rating,
      lastReviewed: new Date(),
      nextReview: nextDate,
      reviewCount: (activeCard.reviewCount || 0) + 1,
    });
    setIsFlipped(false);
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newCard.front.trim() || !newCard.back.trim()) return;
    onAddFlashcard({
      ...newCard,
      id: `fc_${Date.now()}`,
      confidenceRating: 3,
      createdAt: new Date(),
      nextReview: new Date(Date.now() + 86400000),
    });
    setNewCard({ front: "", back: "", type: "q_and_a", difficulty: "medium" });
    setIsModalOpen(false);
  };

  const masteredCount = flashcards.filter((f) => (f.confidenceRating || 3) >= 4).length;

  return (
    <div className="space-y-4 text-xs">
      {/* Studio Header */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
        <div>
          <div className="font-bold text-sm text-[var(--ink)] flex items-center gap-1.5">
            <Layers size={15} className="text-emerald-500" />
            <span>Active Recall Flashcard Studio</span>
          </div>
          <p className="text-[11px] text-[var(--ink-muted)]">
            {flashcards.length} cards ({masteredCount} mastered • Spaced Repetition)
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
        >
          <Plus size={13} className="mr-1" />
          New Flashcard
        </Button>
      </div>

      {flashcards.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] space-y-2">
          <Layers size={32} className="mx-auto text-[var(--ink-muted)] opacity-40" />
          <div className="font-bold text-sm text-[var(--ink)]">No Flashcards in this Document</div>
          <p className="text-[11px] text-[var(--ink-muted)] max-w-sm mx-auto">
            Select text in your notes and click "Flashcard", or click "New Flashcard" above to start active recall revision.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Card Carousel Navigation */}
          <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)] font-semibold px-1">
            <span>
              Card {currentIndex + 1} of {flashcards.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentIndex === 0}
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex((prev) => Math.max(0, prev - 1));
                }}
                className="p-1 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={currentIndex === flashcards.length - 1}
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex((prev) => Math.min(flashcards.length - 1, prev + 1));
                }}
                className="p-1 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* 3D Flip Card Container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[220px] rounded-3xl p-6 border border-[var(--border)] bg-[var(--surface)] hover:border-emerald-500/40 shadow-lg cursor-pointer flex flex-col justify-between transition-all select-none relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
              <span className="uppercase font-bold tracking-wider text-emerald-400">
                {isFlipped ? "Answer / Solution" : "Question / Concept"}
              </span>
              <span className="flex items-center gap-1 text-[10px] bg-[var(--surface-2)] px-2 py-0.5 rounded-full">
                <RotateCw size={10} /> Click to Flip
              </span>
            </div>

            <div className="my-auto py-4 text-center">
              <div className="font-display font-bold text-base sm:text-lg text-[var(--ink)] leading-snug">
                {isFlipped ? activeCard.back : activeCard.front}
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[var(--ink-muted)] border-t border-[var(--border)] pt-2">
              <span className="capitalize">{activeCard.type || "Q&A"}</span>
              <span>Confidence: {activeCard.confidenceRating || 3}/5</span>
            </div>
          </div>

          {/* Spaced Repetition Rating Buttons */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-[var(--ink-muted)] text-center">
              How well did you recall this?
            </div>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => handleRate(1, 1)}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 text-center font-bold transition-all cursor-pointer"
              >
                <div>Forgot</div>
                <div className="text-[9px] font-normal opacity-80">1 day</div>
              </button>
              <button
                onClick={() => handleRate(2, 2)}
                className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 text-center font-bold transition-all cursor-pointer"
              >
                <div>Hard</div>
                <div className="text-[9px] font-normal opacity-80">2 days</div>
              </button>
              <button
                onClick={() => handleRate(4, 4)}
                className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/25 text-center font-bold transition-all cursor-pointer"
              >
                <div>Good</div>
                <div className="text-[9px] font-normal opacity-80">4 days</div>
              </button>
              <button
                onClick={() => handleRate(5, 7)}
                className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 text-center font-bold transition-all cursor-pointer"
              >
                <div>Easy</div>
                <div className="text-[9px] font-normal opacity-80">7 days</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Flashcard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl space-y-3.5">
            <h4 className="font-bold text-sm text-[var(--ink)]">Add Active Recall Flashcard</h4>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[var(--ink-muted)] block mb-1">
                  Front (Question / Prompt) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newCard.front}
                  onChange={(e) => setNewCard({ ...newCard, front: e.target.value })}
                  placeholder="e.g. What is the difference between TCP and UDP?"
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--ink-muted)] block mb-1">
                  Back (Answer / Solution) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newCard.back}
                  onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
                  placeholder="e.g. TCP is connection-oriented, reliable with 3-way handshake. UDP is connectionless, fast, and best-effort."
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  Save Flashcard
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


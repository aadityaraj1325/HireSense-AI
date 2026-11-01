import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Play, Pause, Square, Save, RotateCcw, Clock, Sparkles } from "lucide-react";
import { useSaveFocusSession } from "@/hooks/useDeveloperTracker";

export function FocusTimer({ onSessionSaved }) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState(null);

  // Form states
  const [topic, setTopic] = useState("");
  const [problemsAttempted, setProblemsAttempted] = useState(0);
  const [projectWork, setProjectWork] = useState("");
  const [learningObjective, setLearningObjective] = useState("");
  const [reflection, setReflection] = useState("");
  const [skillsPracticedInput, setSkillsPracticedInput] = useState("");

  const [showSaveModal, setShowSaveModal] = useState(false);
  const intervalRef = useRef(null);

  const saveMutation = useSaveFocusSession();

  // Timer tick
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, isPaused]);

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
    if (!startTime) {
      setStartTime(new Date());
    }
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleStop = () => {
    setIsActive(false);
    setIsPaused(false);
    clearInterval(intervalRef.current);
    setShowSaveModal(true);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    clearInterval(intervalRef.current);
    setSeconds(0);
    setStartTime(null);
  };

  const formatTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    const durationMinutes = Math.max(1, Math.round(seconds / 60));
    const end = new Date();
    const start = startTime || new Date(end.getTime() - durationMinutes * 60 * 1000);

    const skills = skillsPracticedInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    await saveMutation.mutateAsync({
      topic: topic.trim(),
      durationMinutes,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      sessionDate: start.toISOString().slice(0, 10),
      problemsAttempted: Number(problemsAttempted) || 0,
      projectWork: projectWork.trim(),
      learningObjective: learningObjective.trim(),
      reflection: reflection.trim(),
      skillsPracticed: skills,
    });

    // Reset form & timer
    setSeconds(0);
    setStartTime(null);
    setShowSaveModal(false);
    setTopic("");
    setProblemsAttempted(0);
    setProjectWork("");
    setLearningObjective("");
    setReflection("");
    setSkillsPracticedInput("");

    if (onSessionSaved) onSessionSaved();
  };

  return (
    <Card className="relative overflow-hidden border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="text-[var(--accent)]" size={18} />
            <CardTitle>My Developer Focus</CardTitle>
          </div>
          <Badge tone={isActive ? "accent" : "neutral"} className="px-2.5 py-1">
            {isActive ? (isPaused ? "Paused" : "Deep Work Active") : "Ready"}
          </Badge>
        </div>
        <CardDescription>
          Record verified coding focus time. Real sessions power your focus metrics, streak intelligence, and career proof.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stopwatch Display */}
        <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-[var(--bg)] border border-[var(--border)] shadow-inner">
          <div className="font-mono text-5xl sm:text-6xl font-bold tracking-tight text-[var(--ink)] tabular">
            {formatTime(seconds)}
          </div>
          <p className="mt-2 text-xs text-[var(--ink-muted)]">
            {seconds > 0 ? `${Math.floor(seconds / 60)} minutes completed` : "Target 45–90 min deep work"}
          </p>
        </div>

        {/* Timer Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {!isActive && seconds === 0 && (
            <Button variant="accent" size="lg" onClick={handleStart} className="px-6 gap-2">
              <Play size={16} fill="currentColor" />
              Start Focus Session
            </Button>
          )}

          {isActive && !isPaused && (
            <>
              <Button variant="outline" size="md" onClick={handlePause} className="gap-2">
                <Pause size={15} />
                Pause
              </Button>
              <Button variant="primary" size="md" onClick={handleStop} className="gap-2">
                <Square size={15} fill="currentColor" />
                Finish & Log
              </Button>
            </>
          )}

          {isActive && isPaused && (
            <>
              <Button variant="accent" size="md" onClick={handleResume} className="gap-2">
                <Play size={15} fill="currentColor" />
                Resume
              </Button>
              <Button variant="primary" size="md" onClick={handleStop} className="gap-2">
                <Square size={15} fill="currentColor" />
                Finish & Log
              </Button>
            </>
          )}

          {seconds > 0 && !isActive && (
            <>
              <Button variant="accent" size="md" onClick={() => setShowSaveModal(true)} className="gap-2">
                <Save size={15} />
                Save Session Details
              </Button>
              <Button variant="ghost" size="md" onClick={handleReset} className="gap-2 text-[var(--ink-muted)]">
                <RotateCcw size={15} />
                Reset
              </Button>
            </>
          )}
        </div>

        {/* Save / Edit Session Modal Form */}
        {showSaveModal && (
          <form onSubmit={handleSave} className="p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-4 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h4 className="font-semibold text-sm text-[var(--ink)] flex items-center gap-2">
                <Sparkles size={15} className="text-[var(--accent)]" />
                Save Session: {Math.max(1, Math.round(seconds / 60))} Minutes Recorded
              </h4>
              <Badge tone="success">{Math.max(1, Math.round(seconds / 60))}m</Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-[var(--ink)] block mb-1">
                  Study Topic / Goal *
                </label>
                <Input
                  required
                  placeholder="e.g. Graph Algorithms - Dijkstra & Bellman-Ford"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--ink)] block mb-1">
                  Problems Attempted
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={problemsAttempted}
                  onChange={(e) => setProblemsAttempted(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--ink)] block mb-1">
                  Project Worked On (Optional)
                </label>
                <Input
                  placeholder="e.g. HireSense AI Backend"
                  value={projectWork}
                  onChange={(e) => setProjectWork(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-[var(--ink)] block mb-1">
                  Skills Practiced (Comma-separated)
                </label>
                <Input
                  placeholder="e.g. Dynamic Programming, TypeScript, Express"
                  value={skillsPracticedInput}
                  onChange={(e) => setSkillsPracticedInput(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-[var(--ink)] block mb-1">
                  Daily Reflection / Key Takeaways
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                  placeholder="What was completed? What was tricky? What remains for tomorrow?"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSaveModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={saveMutation.isPending || !topic.trim()}
              >
                {saveMutation.isPending ? "Saving..." : "Confirm & Save Session"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}


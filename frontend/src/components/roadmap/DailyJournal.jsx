import { useState } from "react";
import { BookOpen, Check, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { careerRoadmapsApi } from "@/api/resumes";

const notesKey = (roadmapId, date) => ["career-roadmap-notes", roadmapId, date];

export function DailyJournal({ roadmapId, noteDate }) {
  const queryClient = useQueryClient();
  const [activeNote, setActiveNote] = useState(null);
  const [draft, setDraft] = useState({ title: "", content: "", topic: "", tags: [] });
  const notesQuery = useQuery({
    queryKey: notesKey(roadmapId, noteDate),
    queryFn: () => careerRoadmapsApi.notes(roadmapId, { noteDate }),
    enabled: !!roadmapId && !!noteDate,
  });
  const save = useMutation({
    mutationFn: (body) => activeNote
      ? careerRoadmapsApi.updateNote(roadmapId, activeNote._id, body)
      : careerRoadmapsApi.createNote(roadmapId, { ...body, noteDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKey(roadmapId, noteDate) });
      setActiveNote(null);
      setDraft({ title: "", content: "", topic: "", tags: [] });
    },
  });
  const remove = useMutation({
    mutationFn: (id) => careerRoadmapsApi.deleteNote(roadmapId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKey(roadmapId, noteDate) }),
  });
  const notes = notesQuery.data?.notes || [];

  const edit = (note) => {
    setActiveNote(note);
    setDraft({ title: note.title, content: note.content, topic: note.topic || "", tags: note.tags || [] });
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2"><BookOpen size={18} className="text-[var(--accent-strong)]" /> Daily journal</CardTitle>
          <CardDescription className="mt-1">Capture what you learned on {noteDate}.</CardDescription>
        </div>
        <Button size="sm" variant="soft" onClick={() => { setActiveNote(null); setDraft({ title: "", content: "", topic: "", tags: [] }); }}><Plus size={14} /> New note</Button>
      </CardHeader>
      <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
        <div className="space-y-2">
          {notesQuery.isLoading && <LoaderCircle className="animate-spin text-[var(--accent)]" size={18} />}
          {!notesQuery.isLoading && !notes.length && <p className="rounded-xl bg-[var(--surface-2)] p-4 text-sm text-[var(--ink-muted)]">No notes yet. Save a reflection, question, or key concept.</p>}
          {notes.map((note) => <div key={note._id} className={`group flex items-start justify-between gap-2 rounded-xl border p-3 ${activeNote?._id === note._id ? "border-[var(--accent)]" : "border-[var(--border)]"}`}><button type="button" className="min-w-0 flex-1 text-left" onClick={() => edit(note)}><p className="truncate text-sm font-semibold">{note.title}</p><p className="mt-1 line-clamp-2 text-xs text-[var(--ink-muted)]">{note.content}</p></button><button type="button" aria-label={`Delete ${note.title}`} className="rounded p-1 text-[var(--ink-muted)] opacity-70 hover:text-red-500" onClick={() => remove.mutate(note._id)}><Trash2 size={14} /></button></div>)}
        </div>
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); if (draft.title.trim() && draft.content.trim()) save.mutate(draft); }}>
          <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Note title" maxLength={180} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
          <input value={draft.topic} onChange={(event) => setDraft({ ...draft, topic: event.target.value })} placeholder="Topic (optional)" maxLength={120} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
          <textarea value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} placeholder="What did you learn? What needs revision?" rows={7} maxLength={20000} className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
          <div className="flex justify-end"><Button type="submit" variant="accent" size="sm" disabled={save.isPending || !draft.title.trim() || !draft.content.trim()}>{save.isPending ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />} {activeNote ? "Update note" : "Save note"}</Button></div>
        </form>
      </div>
    </Card>
  );
}

import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Bookmark, Check, Clipboard, Clock3, History,
  Loader2, MessageCircle, NotebookPen, Send, Sparkles, Target,
} from "lucide-react";
import { careerRoadmapsApi } from "@/api/resumes";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

function renderInline(text) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index} className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[.9em] text-[var(--accent-strong)]">{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    return <span key={index}>{part}</span>;
  });
}

function Markdown({ value = "" }) {
  const blocks = value.split(/\n{2,}/).filter(Boolean);
  return <div className="prose-hire space-y-4 text-[15px] leading-7 text-[var(--ink-muted)]">{blocks.map((block, index) => {
    const lines = block.split("\n");
    if (lines[0].startsWith("```")) {
      return <pre key={index} className="overflow-x-auto rounded-2xl bg-[#111522] p-4 text-sm leading-6 text-[#d9e3ff]"><code>{lines.slice(1, -1).join("\n")}</code></pre>;
    }
    if (/^#{1,3}\s/.test(lines[0])) {
      const level = lines[0].match(/^#+/)[0].length;
      const Heading = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
      return <Heading key={index} className="font-display text-xl font-semibold text-[var(--ink)]">{lines[0].replace(/^#+\s/, "")}</Heading>;
    }
    if (lines.every((line) => /^[-*]\s/.test(line))) return <ul key={index} className="list-disc space-y-1 pl-5">{lines.map((line) => <li key={line}>{renderInline(line.replace(/^[-*]\s/, ""))}</li>)}</ul>;
    return <p key={index}>{renderInline(block.replace(/\n/g, " "))}</p>;
  })}</div>;
}

function extractConversation(data) {
  return data?.conversation || data?.mentorConversation || data;
}

export default function MentorWorkspace() {
  const { id, roadmapId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const initialTopic = params.get("topic") || "";
  const [topic, setTopic] = useState(initialTopic);
  const [followUp, setFollowUp] = useState("");
  const [activeId, setActiveId] = useState(null);
  const historyQuery = useQuery({
    queryKey: ["mentor-conversations", roadmapId],
    queryFn: () => careerRoadmapsApi.mentorConversations(roadmapId),
    enabled: !!roadmapId,
  });
  const [conversation, setConversation] = useState(null);
  const generate = useMutation({
    mutationFn: async (question) => {
      let streamed = "";
      setConversation({ title: question, messages: [{ role: "assistant", content: "" }] });
      const result = await careerRoadmapsApi.mentorWorkspaceStream(roadmapId, { topic: question }, (chunk) => {
        streamed += chunk;
        setConversation({ title: question, messages: [{ role: "assistant", content: streamed }] });
      });
      return { result, streamed };
    },
    onSuccess: (data) => {
      const conversation = extractConversation(data.result) || { title: topic, messages: [{ role: "assistant", content: data.streamed }] };
      setConversation(conversation);
      setActiveId(conversation?._id || conversation?.id || data.result?.conversationId);
      queryClient.invalidateQueries({ queryKey: ["mentor-conversations", roadmapId] });
    },
  });
  const followUpMutation = useMutation({
    mutationFn: (question) => careerRoadmapsApi.mentorFollowUp(roadmapId, activeId, { message: question }),
    onSuccess: (data) => {
      setFollowUp("");
      setConversation(extractConversation(data));
      queryClient.invalidateQueries({ queryKey: ["mentor-conversations", roadmapId] });
    },
  });
  const bookmark = useMutation({
    mutationFn: (value) => careerRoadmapsApi.bookmarkMentor(roadmapId, activeId, value),
    onSuccess: (data) => setConversation(extractConversation(data)),
  });
  const saveNote = useMutation({
    mutationFn: () => careerRoadmapsApi.saveMentorNote(roadmapId, activeId, { title: conversation?.title || topic, noteDate: new Date().toISOString().slice(0, 10), revisionStatus: "needs_review" }),
  });
  const messages = conversation?.messages || [];
  const answer = messages.filter((message) => message.role !== "user").at(-1)?.content || conversation?.answer || "";
  const history = historyQuery.data?.conversations || historyQuery.data?.items || [];
  const tableOfContents = useMemo(() => answer.split("\n").filter((line) => /^#{1,3}\s/.test(line)).map((line) => line.replace(/^#+\s/, "")), [answer]);

  function submitTopic(event) {
    event.preventDefault();
    if (topic.trim() && !generate.isPending) generate.mutate(topic.trim());
  }

  function submitFollowUp(event) {
    event.preventDefault();
    if (followUp.trim() && activeId && !followUpMutation.isPending) followUpMutation.mutate(followUp.trim());
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => navigate(`/resumes/${id}/roadmap/${roadmapId}`)}><ArrowLeft size={15} /> Back to roadmap</Button>
        <Badge tone="accent"><Sparkles size={13} /> HireSense Career Mentor AI</Badge>
      </div>
      <div className="grid gap-6 xl:grid-cols-[230px_minmax(0,1fr)_250px]">
        <aside className="space-y-4">
          <Card className="xl:sticky xl:top-6">
            <CardHeader><div><CardTitle className="flex items-center gap-2 text-base"><History size={16} /> Conversations</CardTitle><CardDescription className="mt-1">Return to a previous lesson.</CardDescription></div></CardHeader>
            <div className="space-y-1">{history.map((item) => <button key={item._id} type="button" onClick={() => { setActiveId(item._id); setConversation(item); }} className={`w-full rounded-xl p-3 text-left text-xs transition hover:bg-[var(--surface-2)] ${item._id === activeId ? "bg-[var(--accent-soft)]" : ""}`}><span className="line-clamp-2 font-medium">{item.title || item.topic || "Mentor lesson"}</span><span className="mt-1 flex items-center gap-1 text-[var(--ink-muted)]"><Clock3 size={11} /> {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}</span></button>)}</div>
          </Card>
        </aside>
        <main className="min-w-0 space-y-5">
          <Card className="bg-[var(--surface-2)]">
            <CardHeader><div><CardTitle className="flex items-center gap-2 text-2xl"><MessageCircle size={21} className="text-[var(--accent-strong)]" /> Learn anything for your target career</CardTitle><CardDescription className="mt-2">Get a complete explanation grounded in your roadmap, resume skills, and current milestone.</CardDescription></div></CardHeader>
            <form onSubmit={submitTopic} className="flex gap-2"><input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. Explain conditional routing in LangGraph" className="min-w-0 flex-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]" /><Button type="submit" variant="accent" disabled={generate.isPending}>{generate.isPending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Learn</Button></form>
          </Card>
          {!conversation && !generate.isPending && <Card className="min-h-[400px] place-content-center text-center"><div className="mx-auto max-w-md"><Target className="mx-auto text-[var(--accent-strong)]" size={34} /><h2 className="mt-4 font-display text-2xl font-semibold">Your focused learning space</h2><p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">Ask a topic to receive definitions, step-by-step lessons, real-world examples, code, mistakes, interview questions, and practice exercises.</p></div></Card>}
          {generate.isPending && <Card className="space-y-4"><div className="flex items-center gap-3 text-sm text-[var(--ink-muted)]"><Loader2 className="animate-spin text-[var(--accent)]" size={18} /> Building a detailed lesson with your roadmap context…</div><div className="h-3 animate-pulse rounded bg-[var(--surface-2)]" /><div className="h-3 w-4/5 animate-pulse rounded bg-[var(--surface-2)]" /><div className="h-32 animate-pulse rounded-2xl bg-[var(--surface-2)]" /></Card>}
          {conversation && !generate.isPending && <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4"><div><Badge tone="success">Roadmap-grounded lesson</Badge><h1 className="mt-3 font-display text-3xl font-semibold">{conversation.title || topic}</h1></div><div className="flex gap-1"><Button size="iconSm" variant="ghost" title="Bookmark" onClick={() => bookmark.mutate(!conversation.bookmarked)}><Bookmark size={16} fill={conversation.bookmarked ? "currentColor" : "none"} /></Button><Button size="iconSm" variant="ghost" title="Save to notes" onClick={() => saveNote.mutate()}><NotebookPen size={16} /></Button><Button size="iconSm" variant="ghost" title="Copy lesson" onClick={() => navigator.clipboard?.writeText(answer)}><Clipboard size={16} /></Button></div></div>
            <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_180px]"><article><Markdown value={answer} /><div className="mt-8 border-t border-[var(--border)] pt-5"><h2 className="flex items-center gap-2 font-semibold"><MessageCircle size={17} /> Continue learning</h2><form onSubmit={submitFollowUp} className="mt-3 flex gap-2"><input value={followUp} onChange={(event) => setFollowUp(event.target.value)} placeholder="Ask a follow-up about this lesson..." className="min-w-0 flex-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]" /><Button type="submit" size="iconSm" variant="accent" disabled={followUpMutation.isPending}><Send size={14} /></Button></form></div></article>{tableOfContents.length > 0 && <aside className="hidden lg:block"><div className="sticky top-6"><p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">On this page</p><nav className="mt-3 space-y-2 border-l border-[var(--border)] pl-3">{tableOfContents.map((item) => <div key={item} className="text-xs leading-5 text-[var(--ink-muted)]">{item}</div>)}</nav></div></aside>}</div>
          </Card>}
          {generate.isError && <p className="text-sm text-red-500">{generate.error?.message || "The mentor could not generate this lesson. Please retry."}</p>}
        </main>
        <aside className="hidden xl:block"><Card className="sticky top-6"><CardHeader><div><CardTitle className="text-base">Learning context</CardTitle><CardDescription className="mt-1">Used to tailor this lesson.</CardDescription></div></CardHeader><div className="space-y-3 text-sm text-[var(--ink-muted)]"><div className="flex gap-2"><Target size={15} className="mt-0.5 text-[var(--accent-strong)]" />Selected roadmap milestone</div><div className="flex gap-2"><Check size={15} className="mt-0.5 text-[var(--success)]" />Resume-grounded skill gaps</div><div className="flex gap-2"><NotebookPen size={15} className="mt-0.5 text-[var(--accent-strong)]" />Saved notes and revision</div></div></Card></aside>
      </div>
    </div>
  );
}

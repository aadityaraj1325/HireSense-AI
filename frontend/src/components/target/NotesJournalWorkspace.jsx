import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Search,
  Pin,
  Folder,
  Tag,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Indent,
  Outdent,
  Save,
  CheckCircle2,
  Trash2,
  FileText,
  Clock,
  Sparkles,
  Highlighter,
  Smile,
  Layers,
  HelpCircle,
  Share2,
  Dna,
  History,
  Maximize2,
  Table,
  Link as LinkIcon,
  Image as ImageIcon,
  Quote,
  Minus,
  Superscript,
  Subscript,
  AlertTriangle,
  Lightbulb,
  Check,
  ChevronDown,
  ChevronRight,
  Undo,
  Redo,
  Terminal,
  Columns,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  useTargetNotes,
  useCreateTargetNote,
  useUpdateTargetNote,
  useDeleteTargetNote,
  useExplainNoteSelection,
  useTransformNoteContent,
  useAnalyzeNoteCode,
  useNoteKnowledgeGraph,
  useNoteLearningDNA,
  useCreateDoubtRevisionTask,
} from "@/hooks/useTarget";

import { EmojiPickerPopover, EMOJI_SHORTCUTS } from "./EmojiPickerPopover";
import { SmartHighlightPopover, HIGHLIGHT_COLORS } from "./SmartHighlightPopover";
import { AIExplainDrawer } from "./AIExplainDrawer";
import { AITransformModal } from "./AITransformModal";
import { CodeWorkspaceModal } from "./CodeWorkspaceModal";
import { FlashcardStudioView } from "./FlashcardStudioView";
import { DoubtTrackerView } from "./DoubtTrackerView";
import { KnowledgeGraphView } from "./KnowledgeGraphView";
import { LearningModeView } from "./LearningModeView";
import { LearningDNAView } from "./LearningDNAView";

const SIDEBAR_TABS = [
  { id: "docs", label: "Documents", icon: FileText },
  { id: "highlights", label: "Highlights", icon: Highlighter },
  { id: "flashcards", label: "Flashcards", icon: Layers },
  { id: "doubts", label: "Doubts", icon: HelpCircle },
  { id: "connections", label: "Connections", icon: Share2 },
  { id: "dna", label: "Learning DNA", icon: Dna },
];

export function NotesJournalWorkspace() {
  const [activeSidebarTab, setActiveSidebarTab] = useState("docs");
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNoteId, setActiveNoteId] = useState(null);

  // Note editor states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [folder, setFolder] = useState("General");
  const [tags, setTags] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const [doubts, setDoubts] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [versions, setVersions] = useState([]);
  const [saveStatus, setSaveStatus] = useState("saved"); // saved | saving | unsaved | failed

  // Modals & Panels
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [highlightPopover, setHighlightPopover] = useState(null); // { selectedText, existingHighlight }
  const [isExplainDrawerOpen, setIsExplainDrawerOpen] = useState(false);
  const [explainLevel, setExplainLevel] = useState("intermediate");
  const [selectedTextForAI, setSelectedTextForAI] = useState("");
  const [isTransformModalOpen, setIsTransformModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isLearningModeOpen, setIsLearningModeOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  // Formatting Dropdowns
  const [activeFontFamily, setActiveFontFamily] = useState("Inter, sans-serif");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const editorRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Queries & Mutations
  const { data: notes = [], isLoading: isLoadingNotes } = useTargetNotes({
    folder: selectedFolder === "all" ? undefined : selectedFolder,
    search: searchQuery || undefined,
  });

  const createNoteMutation = useCreateTargetNote();
  const updateNoteMutation = useUpdateTargetNote();
  const deleteNoteMutation = useDeleteTargetNote();

  const explainMutation = useExplainNoteSelection();
  const transformMutation = useTransformNoteContent();
  const codeAnalysisMutation = useAnalyzeNoteCode();
  const createDoubtTaskMutation = useCreateDoubtRevisionTask();

  const { data: graphData, isLoading: isLoadingGraph } = useNoteKnowledgeGraph();
  const { data: dnaData, isLoading: isLoadingDNA } = useNoteLearningDNA();

  // Active note resolution
  const currentNote = notes.find((n) => n._id === activeNoteId) || notes[0];

  useEffect(() => {
    if (currentNote && currentNote._id !== activeNoteId) {
      setActiveNoteId(currentNote._id);
      setTitle(currentNote.title || "");
      setContent(currentNote.content || "");
      setFolder(currentNote.folder || "General");
      setTags((currentNote.tags || []).join(", "));
      setIsPinned(currentNote.isPinned || false);
      setHighlights(currentNote.highlights || []);
      setDoubts(currentNote.doubts || []);
      setFlashcards(currentNote.flashcards || []);
      setVersions(currentNote.versions || []);
      if (editorRef.current) {
        editorRef.current.innerHTML = currentNote.content || "";
      }
    }
  }, [currentNote]);

  // Warn on tab close if unsaved
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (saveStatus === "unsaved" || saveStatus === "saving") {
        e.preventDefault();
        e.returnValue = "You have unsaved study note changes. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveStatus]);

  // 1. Rich Text Execution Engine
  const formatDoc = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    handleEditorInput();
  };

  const insertHTMLAtCursor = (html) => {
    if (document.getSelection) {
      const sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const el = document.createElement("div");
        el.innerHTML = html;
        const frag = document.createDocumentFragment();
        let node, lastNode;
        while ((node = el.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);
        if (lastNode) {
          range.setStartAfter(lastNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    } else {
      document.execCommand("insertHTML", false, html);
    }
    handleEditorInput();
  };

  // 2. Autosave with Debounce & Version Snapshot
  const handleEditorInput = () => {
    setSaveStatus("unsaved");
    if (!editorRef.current) return;

    let html = editorRef.current.innerHTML;

    // Quick Emoji Shortcut Replacements (:check: -> ✅, etc.)
    for (const [shortcut, emoji] of Object.entries(EMOJI_SHORTCUTS)) {
      if (html.includes(shortcut)) {
        html = html.replaceAll(shortcut, emoji);
        editorRef.current.innerHTML = html;
      }
    }
    setContent(html);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      if (!activeNoteId) return;
      setSaveStatus("saving");
      try {
        const currentHtml = editorRef.current?.innerHTML || "";
        const words = (editorRef.current?.innerText || "").trim().split(/\s+/).filter(Boolean).length;

        // Create version snapshot every 5th save or if first version
        const newVersions = [...versions];
        if (newVersions.length === 0 || words !== newVersions[newVersions.length - 1]?.wordCount) {
          newVersions.push({
            id: `v_${Date.now()}`,
            versionNumber: newVersions.length + 1,
            title: title || "Untitled Note",
            content: currentHtml,
            wordCount: words,
            changeSummary: `Snapshot at ${new Date().toLocaleTimeString()}`,
            savedAt: new Date(),
          });
          if (newVersions.length > 20) newVersions.shift();
          setVersions(newVersions);
        }

        await updateNoteMutation.mutateAsync({
          id: activeNoteId,
          data: {
            title: title || "Untitled Note",
            content: currentHtml,
            folder,
            tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
            isPinned,
            highlights,
            doubts,
            flashcards,
            versions: newVersions,
            wordCount: words,
          },
        });
        setSaveStatus("saved");
      } catch (err) {
        console.error("Autosave failed:", err);
        setSaveStatus("failed");
      }
    }, 1500);
  };

  // 3. Document Creation
  const handleCreateNewNote = async () => {
    const created = await createNoteMutation.mutateAsync({
      title: "New Study Document",
      content: "<h2>Overview</h2><p>Capture key definitions, formulas, code snippets, and active recall takeaways...</p>",
      folder: "General",
      tags: [],
    });
    if (created?.data?._id) {
      setActiveNoteId(created.data._id);
      setTitle(created.data.title);
      setContent(created.data.content);
      setHighlights([]);
      setDoubts([]);
      setFlashcards([]);
      setVersions([]);
      if (editorRef.current) {
        editorRef.current.innerHTML = created.data.content;
      }
    }
  };

  // 4. Smart Highlighting Handler
  const handleApplyHighlight = (hlData) => {
    const hex = HIGHLIGHT_COLORS.find((c) => c.id === hlData.color)?.hex || "#facc15";
    const span = `<mark data-highlight-id="${hlData.id}" style="background-color: ${hex}33; border-bottom: 2px solid ${hex}; padding: 2px 4px; border-radius: 4px; cursor: pointer; color: inherit;">${hlData.text}</mark>`;

    // Replace selection with highlight mark
    insertHTMLAtCursor(span);

    // Save highlight in state and trigger autosave
    const updated = [...highlights.filter((h) => h.id !== hlData.id), hlData];
    setHighlights(updated);
    setHighlightPopover(null);
    handleEditorInput();
  };

  const handleRemoveHighlight = (hlId) => {
    setHighlights(highlights.filter((h) => h.id !== hlId));
    setHighlightPopover(null);
    handleEditorInput();
  };

  // Detect text selection on mouseup in editor
  const handleEditorMouseUp = (e) => {
    // If clicked on an existing mark
    const target = e.target;
    if (target && target.tagName === "MARK" && target.dataset.highlightId) {
      const hl = highlights.find((h) => h.id === target.dataset.highlightId);
      if (hl) {
        setHighlightPopover({
          selectedText: hl.text,
          existingHighlight: hl,
        });
        return;
      }
    }

    const sel = window.getSelection();
    const str = sel?.toString()?.trim();
    if (str && str.length > 2) {
      setSelectedTextForAI(str);
      setHighlightPopover({
        selectedText: str,
        existingHighlight: null,
      });
    }
  };

  // 5. AI Explain Triggers
  const triggerExplainSelection = (text = selectedTextForAI) => {
    const snippet = text || (window.getSelection()?.toString()?.trim()) || title;
    if (!snippet) return;
    setSelectedTextForAI(snippet);
    setHighlightPopover(null);
    setIsExplainDrawerOpen(true);
    explainMutation.mutate({
      selectedText: snippet,
      contextTitle: title,
      level: explainLevel,
    });
  };

  const handleLevelChange = (lvl) => {
    setExplainLevel(lvl);
    explainMutation.mutate({
      selectedText: selectedTextForAI,
      contextTitle: title,
      level: lvl,
    });
  };

  // 6. AI Transform Triggers
  const handleRunTransform = (type) => {
    transformMutation.mutate({
      text: selectedTextForAI || editorRef.current?.innerText || content,
      transformType: type,
      title,
    });
  };

  // 7. Flashcards & Doubts Callbacks
  const handleAddFlashcardFromSelection = (frontText = selectedTextForAI, backText = "") => {
    const card = {
      id: `fc_${Date.now()}`,
      front: frontText,
      back: backText || "Key definition / concept explanation",
      type: "definition",
      difficulty: "medium",
      confidenceRating: 3,
      createdAt: new Date(),
      nextReview: new Date(Date.now() + 86400000),
    };
    setFlashcards([...flashcards, card]);
    setHighlightPopover(null);
    handleEditorInput();
  };

  const handleMarkSelectionAsDoubt = (text = selectedTextForAI) => {
    const doubt = {
      id: `d_${Date.now()}`,
      text: text,
      title: text.slice(0, 35),
      category: "Need an example",
      status: "unresolved",
      createdAt: new Date(),
    };
    setDoubts([...doubts, doubt]);
    setHighlightPopover(null);
    handleEditorInput();
  };

  // Folders list
  const folders = Array.from(new Set(notes.map((n) => n.folder || "General")));

  // Word count & Char count
  const wordCount = (editorRef.current?.innerText || "").trim().split(/\s+/).filter(Boolean).length;
  const charCount = (editorRef.current?.innerText || "").length;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-card">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <BookOpen size={13} />
            <span>AI-Powered Study Docs & Living Knowledgebase</span>
          </div>
          <h2 className="font-display font-bold text-xl text-[var(--ink)]">
            Intelligent Learning Workspace
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
            Active recall flashcards, 10-dimension AI explanations, smart multi-color highlights, and automatic knowledge graphing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={() => setIsLearningModeOpen(true)}
            variant="outline"
            className="rounded-2xl text-xs flex items-center gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-semibold cursor-pointer"
          >
            <Maximize2 size={13} />
            <span>Learning Mode</span>
          </Button>

          <Button
            onClick={handleCreateNewNote}
            className="rounded-2xl text-xs flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer shrink-0"
          >
            <Plus size={14} />
            <span>New Document</span>
          </Button>
        </div>
      </div>

      {/* 2. Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Sidebar Workspace Tabs (4 Cols) */}
        <div className="lg:col-span-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-card space-y-4">
          {/* Sub-Tabs Selector */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] text-[10px]">
            {SIDEBAR_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSidebarTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSidebarTab(tab.id)}
                  className={`py-1.5 rounded-xl font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                    isActive
                      ? "bg-amber-500 text-black shadow-sm font-extrabold"
                      : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  }`}
                  title={tab.label}
                >
                  <Icon size={13} />
                  <span className="truncate max-w-[48px]">{tab.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: Documents List */}
          {activeSidebarTab === "docs" && (
            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-[var(--ink-muted)]" />
                <input
                  type="text"
                  placeholder="Search notes, tags, concepts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Folders filter */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
                <button
                  onClick={() => setSelectedFolder("all")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                    selectedFolder === "all"
                      ? "bg-amber-500/20 text-amber-500 font-bold"
                      : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  All ({notes.length})
                </button>
                {folders.map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedFolder(f)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                      selectedFolder === f
                        ? "bg-amber-500/20 text-amber-500 font-bold"
                        : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Notes list */}
              <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
                {isLoadingNotes ? (
                  <div className="p-6 text-center text-xs text-[var(--ink-muted)]">Loading notes...</div>
                ) : notes.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[var(--ink-muted)]">No documents found.</div>
                ) : (
                  notes.map((n) => {
                    const isActive = n._id === (currentNote?._id || activeNoteId);
                    return (
                      <div
                        key={n._id}
                        onClick={() => {
                          setActiveNoteId(n._id);
                          setTitle(n.title);
                          setContent(n.content);
                          setFolder(n.folder || "General");
                          setTags((n.tags || []).join(", "));
                          setIsPinned(n.isPinned || false);
                          setHighlights(n.highlights || []);
                          setDoubts(n.doubts || []);
                          setFlashcards(n.flashcards || []);
                          setVersions(n.versions || []);
                          if (editorRef.current) {
                            editorRef.current.innerHTML = n.content || "";
                          }
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                          isActive
                            ? "bg-amber-500/10 border-amber-500/40 shadow-sm"
                            : "bg-[var(--surface-2)] border-[var(--border)] hover:border-amber-500/20"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[var(--ink)] truncate max-w-[170px]">
                            {n.title || "Untitled Note"}
                          </span>
                          <span className="text-[10px] text-[var(--ink-muted)] px-1.5 py-0.5 rounded bg-[var(--surface)]">
                            {n.folder || "General"}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--ink-muted)] line-clamp-1">
                          {n.content ? n.content.replace(/<[^>]+>/g, " ") : "Empty note..."}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[var(--ink-muted)] pt-1">
                          <span>{(n.highlights || []).length} highlights</span>
                          <span>{(n.flashcards || []).length} cards</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Highlights Summary */}
          {activeSidebarTab === "highlights" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--ink)] border-b border-[var(--border)] pb-2">
                <span>Smart Highlights ({highlights.length})</span>
                <span className="text-[10px] text-amber-500 font-semibold">In current doc</span>
              </div>

              {highlights.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--ink-muted)] border border-dashed border-[var(--border)] rounded-2xl">
                  Select text in editor to highlight key definitions, exam formulas, or concepts.
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {highlights.map((hl) => {
                    const colorObj = HIGHLIGHT_COLORS.find((c) => c.id === hl.color) || HIGHLIGHT_COLORS[0];
                    return (
                      <div
                        key={hl.id}
                        onClick={() => setHighlightPopover({ selectedText: hl.text, existingHighlight: hl })}
                        className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1.5 cursor-pointer hover:border-amber-500/30 transition-all"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className={`px-2 py-0.5 rounded-full font-bold border ${colorObj.bg} ${colorObj.text} ${colorObj.border}`}>
                            {hl.category || "Important"}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveHighlight(hl.id);
                            }}
                            className="text-[var(--ink-muted)] hover:text-red-500 p-0.5"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                        <div className="text-xs font-medium text-[var(--ink)] italic line-clamp-3">
                          "{hl.text}"
                        </div>
                        {hl.comment && (
                          <div className="text-[10px] text-blue-400 border-t border-[var(--border)]/50 pt-1">
                            Note: {hl.comment}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Flashcards */}
          {activeSidebarTab === "flashcards" && (
            <FlashcardStudioView
              flashcards={flashcards}
              currentDocTitle={title}
              onAddFlashcard={(c) => {
                setFlashcards([...flashcards, c]);
                handleEditorInput();
              }}
              onUpdateFlashcard={(id, data) => {
                setFlashcards(flashcards.map((f) => (f.id === id ? { ...f, ...data } : f)));
                handleEditorInput();
              }}
              onDeleteFlashcard={(id) => {
                setFlashcards(flashcards.filter((f) => f.id !== id));
                handleEditorInput();
              }}
            />
          )}

          {/* TAB 4: Doubts Tracker */}
          {activeSidebarTab === "doubts" && (
            <DoubtTrackerView
              doubts={doubts}
              currentDocTitle={title}
              onUpdateDoubtStatus={(id, status) => {
                setDoubts(doubts.map((d) => (d.id === id ? { ...d, status } : d)));
                handleEditorInput();
              }}
              onAskAIExplainDoubt={(d) => triggerExplainSelection(d.text)}
              onCreateRevisionTask={async (data) => {
                await createDoubtTaskMutation.mutateAsync({
                  ...data,
                  docId: activeNoteId,
                });
              }}
              onDeleteDoubt={(id) => {
                setDoubts(doubts.filter((d) => d.id !== id));
                handleEditorInput();
              }}
            />
          )}

          {/* TAB 5: Knowledge Connections */}
          {activeSidebarTab === "connections" && (
            <KnowledgeGraphView
              graphData={graphData}
              isLoading={isLoadingGraph}
              currentDocId={activeNoteId}
              allNotes={notes}
              onSelectDoc={(docId) => setActiveNoteId(docId)}
              onAddManualLink={(link) => {
                // Save link to current note connections
                const currentConns = currentNote?.connections || [];
                const updatedConns = [
                  ...currentConns,
                  {
                    targetNoteId: link.targetId,
                    targetTitle: link.targetTitle,
                    relationshipType: link.type,
                    isSuggested: false,
                  },
                ];
                updateNoteMutation.mutate({
                  id: activeNoteId,
                  data: { connections: updatedConns },
                });
              }}
            />
          )}

          {/* TAB 6: Learning DNA */}
          {activeSidebarTab === "dna" && (
            <LearningDNAView
              dnaData={dnaData}
              isLoading={isLoadingDNA}
              onSelectDoc={(id) => setActiveNoteId(id)}
            />
          )}
        </div>

        {/* Right Canvas: Advanced Rich Text Editor (8 Cols) */}
        <div className="lg:col-span-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-card flex flex-col overflow-hidden relative">
          {/* Top Document Metadata Bar */}
          <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface)]">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                handleEditorInput();
              }}
              placeholder="Untitled Document..."
              className="text-lg font-display font-black text-[var(--ink)] bg-transparent border-none focus:outline-none w-full"
            />

            <div className="flex items-center gap-2.5 shrink-0 text-xs">
              {/* Folder Selector */}
              <input
                type="text"
                value={folder}
                onChange={(e) => {
                  setFolder(e.target.value);
                  handleEditorInput();
                }}
                placeholder="Folder"
                className="w-24 px-2 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[11px] text-[var(--ink)] focus:outline-none"
              />

              {/* Autosave Status Indicator */}
              <span className="text-[11px] text-[var(--ink-muted)] font-mono flex items-center gap-1">
                {saveStatus === "saving" ? (
                  <span className="text-amber-500 animate-pulse font-bold">Saving...</span>
                ) : saveStatus === "saved" ? (
                  <span className="text-emerald-500 flex items-center gap-1 font-bold">
                    <CheckCircle2 size={13} /> Saved
                  </span>
                ) : saveStatus === "failed" ? (
                  <span className="text-rose-400 font-bold">Save Failed</span>
                ) : (
                  <span>Unsaved</span>
                )}
              </span>

              {/* Version History Button */}
              <button
                onClick={() => setIsVersionModalOpen(true)}
                title="Version History"
                className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                <History size={15} />
              </button>

              {/* Delete Doc Button */}
              {currentNote && (
                <button
                  onClick={() => {
                    if (confirm("Delete this entire document?")) {
                      deleteNoteMutation.mutate(currentNote._id);
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--ink-muted)] hover:text-red-500 cursor-pointer"
                  title="Delete Document"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>

          {/* ADVANCED RICH TEXT TOOLBAR */}
          <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-2)] flex flex-wrap items-center gap-1 text-[var(--ink-muted)] relative z-20">
            {/* Undo / Redo */}
            <button
              onClick={() => formatDoc("undo")}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded hover:bg-[var(--surface)] hover:text-[var(--ink)] cursor-pointer"
            >
              <Undo size={14} />
            </button>
            <button
              onClick={() => formatDoc("redo")}
              title="Redo (Ctrl+Y)"
              className="p-1.5 rounded hover:bg-[var(--surface)] hover:text-[var(--ink)] cursor-pointer"
            >
              <Redo size={14} />
            </button>

            <span className="h-4 w-px bg-[var(--border)] mx-1" />

            {/* Typography Styles */}
            <button
              onClick={() => formatDoc("bold")}
              title="Bold"
              className="p-1.5 rounded hover:bg-[var(--surface)] hover:text-[var(--ink)] cursor-pointer"
            >
              <Bold size={14} />
            </button>
            <button
              onClick={() => formatDoc("italic")}
              title="Italic"
              className="p-1.5 rounded hover:bg-[var(--surface)] hover:text-[var(--ink)] cursor-pointer"
            >
              <Italic size={14} />
            </button>
            <button
              onClick={() => formatDoc("underline")}
              title="Underline"
              className="p-1.5 rounded hover:bg-[var(--surface)] hover:text-[var(--ink)] cursor-pointer"
            >
              <Underline size={14} />
            </button>
            <button
              onClick={() => formatDoc("strikeThrough")}
              title="Strikethrough"
              className="p-1.5 rounded hover:bg-[var(--surface)] hover:text-[var(--ink)] cursor-pointer"
            >
              <Strikethrough size={14} />
            </button>
            <button
              onClick={() => formatDoc("superscript")}
              title="Superscript"
              className="p-1.5 rounded hover:bg-[var(--surface)] hover:text-[var(--ink)] cursor-pointer"
            >
              <Superscript size={14} />
            </button>
            <button
              onClick={() => formatDoc("subscript")}
              title="Subscript"
              className="p-1.5 rounded hover:bg-[var(--surface)] hover:text-[var(--ink)] cursor-pointer"
            >
              <Subscript size={14} />
            </button>

            <span className="h-4 w-px bg-[var(--border)] mx-1" />

            {/* Headings */}
            <button
              onClick={() => formatDoc("formatBlock", "<h1>")}
              title="Heading 1"
              className="px-1.5 py-1 rounded hover:bg-[var(--surface)] hover:text-[var(--ink)] text-xs font-bold cursor-pointer"
            >
              H1
            </button>
            <button
              onClick={() => formatDoc("formatBlock", "<h2>")}
              title="Heading 2"
              className="px-1.5 py-1 rounded hover:bg-[var(--surface)] hover:text-[var(--ink)] text-xs font-bold cursor-pointer"
            >
              H2
            </button>
            <button
              onClick={() => formatDoc("formatBlock", "<h3>")}
              title="Heading 3"
              className="px-1.5 py-1 rounded hover:bg-[var(--surface)] hover:text-[var(--ink)] text-xs font-bold cursor-pointer"
            >
              H3
            </button>
            <button
              onClick={() => formatDoc("formatBlock", "<p>")}
              title="Paragraph"
              className="px-1.5 py-1 rounded hover:bg-[var(--surface)] hover:text-[var(--ink)] text-xs cursor-pointer"
            >
              P
            </button>
            <button
              onClick={() => formatDoc("formatBlock", "<blockquote>")}
              title="Quote"
              className="p-1.5 rounded hover:bg-[var(--surface)] hover:text-[var(--ink)] cursor-pointer"
            >
              <Quote size={13} />
            </button>

            <span className="h-4 w-px bg-[var(--border)] mx-1" />

            {/* Lists & Tasks */}
            <button
              onClick={() => formatDoc("insertUnorderedList")}
              title="Bulleted List"
              className="p-1.5 rounded hover:bg-[var(--surface)] hover:text-[var(--ink)] cursor-pointer"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => formatDoc("insertOrderedList")}
              title="Numbered List"
              className="p-1.5 rounded hover:bg-[var(--surface)] hover:text-[var(--ink)] cursor-pointer"
            >
              <ListOrdered size={14} />
            </button>
            <button
              onClick={() => insertHTMLAtCursor('<p><input type="checkbox" style="margin-right:8px; cursor:pointer;" /> Task item</p>')}
              title="Interactive Checklist"
              className="p-1.5 rounded hover:bg-[var(--surface)] hover:text-[var(--ink)] cursor-pointer"
            >
              <CheckSquare size={14} />
            </button>

            <span className="h-4 w-px bg-[var(--border)] mx-1" />

            {/* Alignments */}
            <button
              onClick={() => formatDoc("justifyLeft")}
              title="Align Left"
              className="p-1.5 rounded hover:bg-[var(--surface)] hover:text-[var(--ink)] cursor-pointer"
            >
              <AlignLeft size={14} />
            </button>
            <button
              onClick={() => formatDoc("justifyCenter")}
              title="Align Center"
              className="p-1.5 rounded hover:bg-[var(--surface)] hover:text-[var(--ink)] cursor-pointer"
            >
              <AlignCenter size={14} />
            </button>
            <button
              onClick={() => formatDoc("justifyRight")}
              title="Align Right"
              className="p-1.5 rounded hover:bg-[var(--surface)] hover:text-[var(--ink)] cursor-pointer"
            >
              <AlignRight size={14} />
            </button>

            <span className="h-4 w-px bg-[var(--border)] mx-1" />

            {/* Advanced Blocks: Table, Divider, Callouts */}
            <button
              onClick={() =>
                insertHTMLAtCursor(
                  '<table style="width:100%; border-collapse:collapse; margin:12px 0;"><thead><tr><th style="border:1px solid #4b5563; padding:8px; background:rgba(255,255,255,0.05);">Topic</th><th style="border:1px solid #4b5563; padding:8px; background:rgba(255,255,255,0.05);">Complexity</th><th style="border:1px solid #4b5563; padding:8px; background:rgba(255,255,255,0.05);">Notes</th></tr></thead><tbody><tr><td style="border:1px solid #4b5563; padding:8px;">TCP Handshake</td><td style="border:1px solid #4b5563; padding:8px;">O(1)</td><td style="border:1px solid #4b5563; padding:8px;">3-way exchange</td></tr></tbody></table><p></p>'
                )
              }
              title="Insert 3x3 Table"
              className="p-1.5 rounded hover:bg-[var(--surface)] hover:text-[var(--ink)] cursor-pointer"
            >
              <Table size={14} />
            </button>

            <button
              onClick={() => formatDoc("insertHorizontalRule")}
              title="Horizontal Divider"
              className="p-1.5 rounded hover:bg-[var(--surface)] hover:text-[var(--ink)] cursor-pointer"
            >
              <Minus size={14} />
            </button>

            {/* Callout Tip */}
            <button
              onClick={() =>
                insertHTMLAtCursor(
                  '<div style="padding:12px 16px; margin:12px 0; border-radius:12px; background:rgba(245,158,11,0.1); border-left:4px solid #f59e0b; color:#fbbf24;"><strong>💡 Key Tip:</strong> Add your study tip here...</div><p></p>'
                )
              }
              title="Callout Tip"
              className="p-1.5 rounded hover:bg-[var(--surface)] text-amber-400 cursor-pointer"
            >
              <Lightbulb size={14} />
            </button>

            {/* Warning Callout */}
            <button
              onClick={() =>
                insertHTMLAtCursor(
                  '<div style="padding:12px 16px; margin:12px 0; border-radius:12px; background:rgba(244,63,94,0.1); border-left:4px solid #f43f5e; color:#fda4af;"><strong>⚠️ Warning / Pitfall:</strong> Avoid this common mistake...</div><p></p>'
                )
              }
              title="Callout Warning"
              className="p-1.5 rounded hover:bg-[var(--surface)] text-rose-400 cursor-pointer"
            >
              <AlertTriangle size={14} />
            </button>

            {/* Collapsible Toggle Block */}
            <button
              onClick={() =>
                insertHTMLAtCursor(
                  '<details style="padding:12px; margin:12px 0; border-radius:12px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1);"><summary style="font-weight:bold; cursor:pointer; color:#a78bfa;">Click to reveal solution or proof...</summary><div style="padding-top:8px;">Detailed step-by-step solution here.</div></details><p></p>'
                )
              }
              title="Toggle / Collapsible Section"
              className="p-1.5 rounded hover:bg-[var(--surface)] text-purple-400 cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>

            {/* Emoji Picker Button */}
            <button
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              title="Emoji Intelligence"
              className="p-1.5 rounded hover:bg-[var(--surface)] text-amber-400 cursor-pointer"
            >
              <Smile size={14} />
            </button>

            {/* Code Workspace Button */}
            <button
              onClick={() => setIsCodeModalOpen(true)}
              title="Code Learning & Complexity Workspace"
              className="p-1.5 rounded hover:bg-[var(--surface)] text-blue-400 cursor-pointer flex items-center gap-1 font-bold text-xs"
            >
              <Code size={14} />
              <span className="hidden sm:inline">Code Lab</span>
            </button>

            {/* AI Explain Button */}
            <button
              onClick={() => triggerExplainSelection()}
              title="Explain Selected Text with AI"
              className="px-2 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/30 flex items-center gap-1 font-semibold text-xs cursor-pointer ml-auto"
            >
              <Sparkles size={13} />
              <span>AI Explain</span>
            </button>

            {/* Transform with AI Menu */}
            <button
              onClick={() => setIsTransformModalOpen(true)}
              title="Transform with AI"
              className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-semibold text-xs cursor-pointer"
            >
              <span>🪄</span>
              <span>Transform</span>
            </button>
          </div>

          {/* Floating Emoji Picker Popover */}
          {isEmojiPickerOpen && (
            <div className="absolute top-14 left-10 z-50">
              <EmojiPickerPopover
                onSelectEmoji={(emoji) => {
                  insertHTMLAtCursor(emoji);
                  setIsEmojiPickerOpen(false);
                }}
                onClose={() => setIsEmojiPickerOpen(false)}
              />
            </div>
          )}

          {/* Floating Smart Highlighter Popover */}
          {highlightPopover && (
            <div className="absolute top-20 right-8 z-50">
              <SmartHighlightPopover
                selectedText={highlightPopover.selectedText}
                existingHighlight={highlightPopover.existingHighlight}
                onApplyHighlight={handleApplyHighlight}
                onAskAI={() => triggerExplainSelection(highlightPopover.selectedText)}
                onConvertToFlashcard={() => handleAddFlashcardFromSelection(highlightPopover.selectedText)}
                onMarkAsDoubt={() => handleMarkSelectionAsDoubt(highlightPopover.selectedText)}
                onRemoveHighlight={() => handleRemoveHighlight(highlightPopover.existingHighlight?.id)}
                onClose={() => setHighlightPopover(null)}
              />
            </div>
          )}

          {/* Editable Content Area */}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            onMouseUp={handleEditorMouseUp}
            className="p-8 min-h-[460px] focus:outline-none text-[var(--ink)] text-sm leading-relaxed overflow-y-auto prose dark:prose-invert max-w-none font-sans"
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* Footer Stats & Tags */}
          <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--surface-2)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[var(--ink-muted)]">
            <div className="flex items-center gap-3">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} characters</span>
              <span>•</span>
              <span>{highlights.length} highlights</span>
              <span>•</span>
              <span>{flashcards.length} flashcards</span>
            </div>

            {/* Tags Input */}
            <div className="flex items-center gap-2">
              <Tag size={12} />
              <input
                type="text"
                value={tags}
                onChange={(e) => {
                  setTags(e.target.value);
                  handleEditorInput();
                }}
                placeholder="Tags (comma separated)..."
                className="w-44 px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--ink)] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. AI Deep Explanation Drawer */}
      <AIExplainDrawer
        isOpen={isExplainDrawerOpen}
        onClose={() => setIsExplainDrawerOpen(false)}
        selectedText={selectedTextForAI}
        contextTitle={title}
        explanation={explainMutation.data?.data}
        isLoading={explainMutation.isPending}
        currentLevel={explainLevel}
        onLevelChange={handleLevelChange}
        onInsertIntoDoc={(exp) => {
          const formatted = `
<div style="padding:14px; margin:14px 0; border-radius:14px; background:rgba(168,85,247,0.08); border-left:4px solid #a855f7;">
  <h4 style="font-weight:bold; color:#c084fc; margin-bottom:4px;">💡 AI Deep Note: ${selectedTextForAI}</h4>
  <p><strong>Definition:</strong> ${exp.definition}</p>
  <p>${exp.detailedExplanation}</p>
  <p><strong>Analogy:</strong> <em>${exp.analogy}</em></p>
  <p><strong>Interview Relevance:</strong> ${exp.interviewOrExamRelevance}</p>
</div><p></p>
          `;
          insertHTMLAtCursor(formatted);
          setIsExplainDrawerOpen(false);
        }}
        onSaveAsFlashcard={(exp) => {
          handleAddFlashcardFromSelection(selectedTextForAI, exp.definition || exp.revisionSummary);
          setIsExplainDrawerOpen(false);
        }}
      />

      {/* 4. Transform with AI Modal */}
      <AITransformModal
        isOpen={isTransformModalOpen}
        onClose={() => setIsTransformModalOpen(false)}
        currentTitle={title}
        initialText={selectedTextForAI || editorRef.current?.innerText || content}
        isTransforming={transformMutation.isPending}
        transformResult={transformMutation.data?.data}
        onRunTransform={handleRunTransform}
        onInsertAtCursor={(res) => {
          insertHTMLAtCursor(`<div class="ai-transformed-block">${res}</div><p></p>`);
          setIsTransformModalOpen(false);
        }}
        onReplaceSelected={(res) => {
          insertHTMLAtCursor(`<div class="ai-transformed-block">${res}</div><p></p>`);
          setIsTransformModalOpen(false);
        }}
        onSaveAsNewNote={async (res, type) => {
          const created = await createNoteMutation.mutateAsync({
            title: `${title} (${type.toUpperCase()})`,
            content: `<div class="ai-transformed-block">${res}</div>`,
            folder,
            tags: ["ai_transformed"],
          });
          if (created?.data?._id) {
            setActiveNoteId(created.data._id);
          }
          setIsTransformModalOpen(false);
        }}
      />

      {/* 5. Code Learning Workspace Modal */}
      <CodeWorkspaceModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        initialCode={selectedTextForAI || "// Write algorithm here\n"}
        analysisResult={codeAnalysisMutation.data?.data}
        isLoading={codeAnalysisMutation.isPending}
        onRunAnalysis={(params) => codeAnalysisMutation.mutate(params)}
        onInsertCode={(codeBlock) => insertHTMLAtCursor(codeBlock)}
      />

      {/* 6. Distraction-Free Learning Mode */}
      {isLearningModeOpen && (
        <LearningModeView
          docTitle={title}
          docContent={content}
          onExitLearningMode={() => setIsLearningModeOpen(false)}
          onSaveSession={(session) => {
            const currentSessions = currentNote?.learningSessions || [];
            updateNoteMutation.mutate({
              id: activeNoteId,
              data: {
                learningSessions: [...currentSessions, session],
              },
            });
          }}
        />
      )}

      {/* 7. Version History Modal */}
      {isVersionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <History size={16} className="text-amber-500" />
                <h3 className="font-bold text-sm text-[var(--ink)]">Document Version History</h3>
              </div>
              <button onClick={() => setIsVersionModalOpen(false)} className="text-[var(--ink-muted)] hover:text-[var(--ink)]">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5">
              {versions.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--ink-muted)]">
                  Versions are captured automatically during your study and editing sessions.
                </div>
              ) : (
                versions.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-[var(--ink)]">Version #{v.versionNumber}</div>
                      <div className="text-[11px] text-[var(--ink-muted)]">
                        {new Date(v.savedAt).toLocaleString()} • {v.wordCount} words
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => {
                        if (confirm(`Restore Version #${v.versionNumber}?`)) {
                          setContent(v.content);
                          if (editorRef.current) {
                            editorRef.current.innerHTML = v.content;
                          }
                          handleEditorInput();
                          setIsVersionModalOpen(false);
                        }
                      }}
                      className="rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Restore
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-[var(--border)] flex justify-end">
              <Button onClick={() => setIsVersionModalOpen(false)} className="rounded-xl text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

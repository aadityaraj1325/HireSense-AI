import React, { useState } from "react";
import {
  Share2,
  FileText,
  Sparkles,
  Link2,
  ArrowRight,
  Plus,
  Trash2,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function KnowledgeGraphView({
  graphData,
  isLoading,
  currentDocId,
  allNotes = [],
  onSelectDoc,
  onAddManualLink,
  onRemoveLink,
}) {
  const [selectedNodeId, setSelectedNodeId] = useState(currentDocId);
  const [targetLinkDocId, setTargetLinkDocId] = useState("");
  const [relationshipType, setRelationshipType] = useState("prerequisite_of");

  const nodes = graphData?.nodes || [];
  const links = graphData?.links || [];

  const activeNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  // Connected links for active node
  const activeLinks = links.filter(
    (l) => l.source === activeNode?.id || l.target === activeNode?.id
  );

  const handleCreateLink = (e) => {
    e.preventDefault();
    if (!targetLinkDocId || targetLinkDocId === activeNode?.id) return;
    const targetDoc = nodes.find((n) => n.id === targetLinkDocId);
    onAddManualLink({
      sourceId: activeNode.id,
      targetId: targetLinkDocId,
      targetTitle: targetDoc?.title || "Connected Note",
      type: relationshipType,
    });
    setTargetLinkDocId("");
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between">
        <div>
          <div className="font-bold text-sm text-[var(--ink)] flex items-center gap-1.5">
            <Share2 size={15} className="text-blue-500" />
            <span>Living Knowledge Graph & Conceptual Connections</span>
          </div>
          <p className="text-[11px] text-[var(--ink-muted)]">
            {nodes.length} Connected Documents • {links.length} Concept Linkages
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-10 text-center space-y-2">
          <Share2 size={28} className="mx-auto text-blue-500 animate-pulse" />
          <div className="text-xs font-bold text-[var(--ink)]">Mapping cross-document concept linkages...</div>
        </div>
      ) : nodes.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)]">
          Create 2 or more study notes to automatically map conceptual relationships and prerequisites.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Canvas: Interactive Nodes Network (8 Cols) */}
          <div className="lg:col-span-8 p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] min-h-[360px] flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)] z-10">
              <span className="font-bold uppercase tracking-wider text-blue-400">
                Document Concept Mesh
              </span>
              <span>Click a node to inspect relationships</span>
            </div>

            {/* Interactive Concept Clusters */}
            <div className="my-auto py-6 grid grid-cols-2 sm:grid-cols-3 gap-3 z-10">
              {nodes.map((node) => {
                const isSelected = node.id === activeNode?.id;
                const connectedCount = links.filter((l) => l.source === node.id || l.target === node.id).length;

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1 relative group ${
                      isSelected
                        ? "bg-blue-500/15 border-blue-500 text-blue-400 shadow-md ring-1 ring-blue-500/30"
                        : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--ink)] hover:border-blue-500/40"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-[var(--ink-muted)]">
                      <span className="truncate max-w-[80px]">{node.folder || "General"}</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-400 font-bold">
                        {connectedCount} links
                      </span>
                    </div>

                    <div className="font-bold text-xs truncate max-w-[140px] text-[var(--ink)]">
                      {node.title || "Untitled"}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--ink-muted)] pt-1">
                      <span>{node.highlightsCount} highlights</span>
                      <span>•</span>
                      <span>{node.flashcardsCount} cards</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-[10px] text-[var(--ink-muted)] border-t border-[var(--border)] pt-2 flex items-center justify-between z-10">
              <span>Lines represent shared tags, folders, or prerequisite dependencies.</span>
              {activeNode && (
                <button
                  onClick={() => onSelectDoc(activeNode.id)}
                  className="text-blue-400 hover:underline font-bold flex items-center gap-1"
                >
                  <span>Open "{activeNode.title}" in Editor</span>
                  <ArrowRight size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Right Panel: Selected Node Details & Manual Linking (4 Cols) */}
          <div className="lg:col-span-4 p-4 rounded-3xl bg-[var(--surface-2)]/60 border border-[var(--border)] space-y-4">
            {activeNode ? (
              <div className="space-y-3.5">
                <div className="border-b border-[var(--border)] pb-2.5">
                  <div className="text-[10px] uppercase font-bold text-blue-400">Selected Node</div>
                  <h4 className="font-bold text-sm text-[var(--ink)] mt-0.5">{activeNode.title}</h4>
                  <div className="text-[11px] text-[var(--ink-muted)] mt-1">
                    Folder: {activeNode.folder} • {activeNode.tags?.join(", ") || "No tags"}
                  </div>
                </div>

                {/* Linkages List */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-[var(--ink)]">
                    Connected Concepts ({activeLinks.length})
                  </div>

                  {activeLinks.length === 0 ? (
                    <div className="p-3 rounded-xl bg-[var(--surface)] text-[11px] text-[var(--ink-muted)] border border-dashed border-[var(--border)] text-center">
                      No connections yet. Add a relationship below or assign shared tags.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {activeLinks.map((link) => {
                        const otherId = link.source === activeNode.id ? link.target : link.source;
                        const otherNode = nodes.find((n) => n.id === otherId);

                        return (
                          <div
                            key={link.id}
                            className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-[var(--ink)] truncate max-w-[130px]">
                                {otherNode?.title || "Linked Note"}
                              </div>
                              <div className="text-[10px] text-blue-400 capitalize">
                                {link.type?.replace("_", " ") || "Related"}
                                {link.isSuggested && (
                                  <span className="ml-1 text-[9px] px-1 rounded bg-purple-500/10 text-purple-400 font-semibold">
                                    AI Suggestion
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => onSelectDoc(otherId)}
                              className="text-[10px] text-blue-400 hover:underline px-1.5 py-0.5 rounded bg-blue-500/10"
                            >
                              Jump
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Add Manual Link */}
                <form onSubmit={handleCreateLink} className="space-y-2 pt-2 border-t border-[var(--border)]">
                  <div className="text-[10px] font-bold uppercase text-[var(--ink-muted)]">
                    + Link to Another Note
                  </div>

                  <select
                    value={targetLinkDocId}
                    onChange={(e) => setTargetLinkDocId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none"
                  >
                    <option value="">Select target note...</option>
                    {nodes
                      .filter((n) => n.id !== activeNode.id)
                      .map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.title}
                        </option>
                      ))}
                  </select>

                  <select
                    value={relationshipType}
                    onChange={(e) => setRelationshipType(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none"
                  >
                    <option value="prerequisite_of">Prerequisite of</option>
                    <option value="extends">Extends / Deepens</option>
                    <option value="interview_question">Interview Question of</option>
                    <option value="practical_example">Practical Example of</option>
                  </select>

                  <Button
                    type="submit"
                    disabled={!targetLinkDocId}
                    className="w-full rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer disabled:opacity-40"
                  >
                    <Link2 size={12} className="mr-1" />
                    Connect Notes
                  </Button>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}


import React, { useState } from "react";
import {
  Plus,
  Search,
  MessageSquare,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ConversationSidebar({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onTogglePin,
  onDeleteConversation,
}) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const pinned = filtered.filter((c) => c.isPinned);
  const unpinned = filtered.filter((c) => !c.isPinned);

  // Group unpinned by recency
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOfSevenDaysAgo = startOfToday - 6 * 86400000;

  const today = [];
  const yesterday = [];
  const pastSevenDays = [];
  const older = [];

  unpinned.forEach((c) => {
    const time = new Date(c.lastMessageAt || c.createdAt).getTime();
    if (time >= startOfToday) {
      today.push(c);
    } else if (time >= startOfYesterday) {
      yesterday.push(c);
    } else if (time >= startOfSevenDaysAgo) {
      pastSevenDays.push(c);
    } else {
      older.push(c);
    }
  });

  const startRename = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv._id);
    setEditTitle(conv.title);
  };

  const submitRename = (convId, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(convId, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const renderGroup = (label, list) => {
    if (!list || list.length === 0) return null;

    return (
      <div className="space-y-1">
        <div className="px-3 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          {label}
        </div>
        {list.map((conv) => {
          const isActive = conv._id === activeConversationId;
          const isEditing = conv._id === editingId;

          return (
            <div
              key={conv._id}
              onClick={() => onSelectConversation(conv._id)}
              className={cn(
                "group relative flex items-center justify-between px-3 py-2.5 rounded-2xl cursor-pointer text-xs transition-all",
                isActive
                  ? "bg-[var(--ink)] text-[var(--bg)] font-semibold shadow-sm"
                  : "text-[var(--ink)] hover:bg-[var(--surface-2)]"
              )}
            >
              {isEditing ? (
                <div
                  className="flex items-center gap-1.5 w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitRename(conv._id, e);
                      if (e.key === "Escape") cancelRename(e);
                    }}
                    autoFocus
                    className="flex-1 px-2 py-1 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                  <button
                    onClick={(e) => submitRename(conv._id, e)}
                    className="p-1 hover:text-emerald-500"
                  >
                    <Check size={13} />
                  </button>
                  <button
                    onClick={cancelRename}
                    className="p-1 hover:text-rose-500"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <MessageSquare
                      size={14}
                      className={cn(
                        "shrink-0",
                        isActive ? "text-[var(--bg)]" : "text-[var(--ink-muted)]"
                      )}
                    />
                    <span className="truncate">{conv.title}</span>
                  </div>

                  {/* Actions on hover */}
                  <div
                    className={cn(
                      "items-center gap-1 shrink-0",
                      isActive ? "flex" : "hidden group-hover:flex"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      title={conv.isPinned ? "Unpin chat" : "Pin chat"}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(conv._id, !conv.isPinned);
                      }}
                      className={cn(
                        "p-1 rounded-md transition-colors",
                        isActive
                          ? "hover:bg-[var(--surface)]/20"
                          : "hover:bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
                      )}
                    >
                      <Pin
                        size={12}
                        className={cn(conv.isPinned && "fill-current text-amber-500")}
                      />
                    </button>

                    <button
                      type="button"
                      title="Rename"
                      onClick={(e) => startRename(conv, e)}
                      className={cn(
                        "p-1 rounded-md transition-colors",
                        isActive
                          ? "hover:bg-[var(--surface)]/20"
                          : "hover:bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
                      )}
                    >
                      <Edit2 size={12} />
                    </button>

                    <button
                      type="button"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv._id);
                      }}
                      className={cn(
                        "p-1 rounded-md transition-colors hover:text-rose-500",
                        isActive
                          ? "hover:bg-[var(--surface)]/20"
                          : "hover:bg-[var(--surface)] text-[var(--ink-muted)]"
                      )}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="w-72 lg:w-80 shrink-0 h-[calc(100vh-120px)] flex flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-card overflow-hidden">
      {/* Top Header & New Chat Button */}
      <div className="space-y-3 pb-3 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-[var(--ink)] text-[var(--bg)] font-semibold text-xs transition-all hover:opacity-90 active:scale-98 shadow-sm cursor-pointer"
        >
          <Plus size={15} />
          <span>New Conversation</span>
        </button>

        {/* Search Input */}
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      {/* Conversation Thread List */}
      <div className="flex-1 overflow-y-auto space-y-3 pt-2 pr-1 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-[var(--ink-muted)]">
            No conversations found.
          </div>
        ) : (
          <>
            {renderGroup("Pinned", pinned)}
            {renderGroup("Today", today)}
            {renderGroup("Yesterday", yesterday)}
            {renderGroup("Previous 7 Days", pastSevenDays)}
            {renderGroup("Older", older)}
          </>
        )}
      </div>
    </aside>
  );
}


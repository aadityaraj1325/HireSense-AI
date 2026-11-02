import React, { useState } from "react";
import { Search, X, Smile, BookOpen, Code, Zap, Flag, Heart } from "lucide-react";

export const EMOJI_CATEGORIES = [
  {
    id: "study",
    label: "Study & Tech",
    icon: BookOpen,
    emojis: ["📚", "📖", "📝", "🎓", "✏️", "📐", "🧪", "🔬", "🔍", "📊", "💻", "⚙️", "🖥️", "⚡", "🌐", "🔒", "📦", "🤖", "📱", "🛠️"],
  },
  {
    id: "productivity",
    label: "Productivity",
    icon: Zap,
    emojis: ["✅", "💡", "🔥", "⭐", "🎯", "⏱️", "📅", "🏆", "🥇", "📈", "📌", "📋", "💯", "⏳", "🚀", "🧠", "✨", "🔑", "🏷️", "💎"],
  },
  {
    id: "smileys",
    label: "Smileys",
    icon: Smile,
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚"],
  },
  {
    id: "symbols",
    label: "Symbols",
    icon: Flag,
    emojis: ["⚠️", "❗", "❓", "➡️", "⬅️", "⬆️", "⬇️", "🔴", "🟢", "🟡", "🔵", "🟣", "🟠", "⚫", "⚪", "🏁", "🚩", "🇮🇳", "🇺🇸", "🌐"],
  },
];

export const EMOJI_SHORTCUTS = {
  ":check:": "✅",
  ":idea:": "💡",
  ":warning:": "⚠️",
  ":star:": "⭐",
  ":fire:": "🔥",
  ":book:": "📚",
  ":code:": "💻",
  ":brain:": "🧠",
  ":target:": "🎯",
  ":rocket:": "🚀",
  ":time:": "⏱️",
  ":pin:": "📌",
  ":key:": "🔑",
  ":memo:": "📝",
};

export function EmojiPickerPopover({ onSelectEmoji, onClose }) {
  const [activeCategory, setActiveCategory] = useState("study");
  const [search, setSearch] = useState("");

  const allEmojis = EMOJI_CATEGORIES.flatMap((c) => c.emojis);

  const filteredEmojis = search.trim()
    ? allEmojis.filter((e) => e.includes(search.trim()))
    : EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.emojis || allEmojis;

  return (
    <div className="w-72 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-3 space-y-2.5 z-50 text-xs">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <span className="font-bold text-[var(--ink)] flex items-center gap-1.5">
          <span>😀</span>
          <span>Emoji Intelligence</span>
        </span>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--surface-2)] text-[var(--ink-muted)]">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-2 text-[var(--ink-muted)]" />
        <input
          type="text"
          placeholder="Search emojis or shortcuts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      {!search.trim() && (
        <div className="flex items-center gap-1 border-b border-[var(--border)] pb-1.5">
          {EMOJI_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`p-1.5 rounded-lg flex items-center gap-1 text-[11px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-amber-500/15 text-amber-500 font-bold"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]"
                }`}
                title={cat.label}
              >
                <Icon size={13} />
                <span className="hidden sm:inline">{cat.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto p-1">
        {filteredEmojis.map((emoji, idx) => (
          <button
            key={`${emoji}-${idx}`}
            type="button"
            onClick={() => onSelectEmoji(emoji)}
            className="p-1.5 rounded-lg text-lg hover:bg-[var(--surface-2)] hover:scale-115 transition-all text-center cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Quick shortcuts cheat-sheet */}
      <div className="pt-1.5 border-t border-[var(--border)] text-[10px] text-[var(--ink-muted)] flex items-center justify-between">
        <span>Shortcuts: <code>:check:</code> <code>:fire:</code> <code>:star:</code></span>
      </div>
    </div>
  );
}


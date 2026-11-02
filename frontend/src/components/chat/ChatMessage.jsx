import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  ArrowRight,
  User,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

function renderInline(text) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded-md bg-[var(--surface-2)] px-1.5 py-0.5 text-[0.88em] font-mono font-medium text-[var(--accent-strong)] border border-[var(--border)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-[var(--ink)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-2xl overflow-hidden border border-[#2d3748] bg-[#111827] text-gray-100 font-mono text-xs">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1f2937] bg-[#1f2937]/50 text-gray-400">
        <span className="text-[11px] font-sans font-semibold uppercase tracking-wider">
          {language || "code"}
        </span>
        <button
          onClick={copyCode}
          className="flex items-center gap-1 text-[11px] hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MarkdownRenderer({ content = "" }) {
  const blocks = content.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="space-y-3.5 text-sm leading-relaxed text-[var(--ink)]">
      {blocks.map((block, idx) => {
        const lines = block.split("\n");

        // Code block check
        if (lines[0].startsWith("```")) {
          const lang = lines[0].replace(/^```/, "").trim();
          const code = lines.slice(1, -1).join("\n");
          return <CodeBlock key={idx} code={code} language={lang} />;
        }

        // Heading check
        if (/^#{1,3}\s/.test(lines[0])) {
          const level = lines[0].match(/^#+/)[0].length;
          const headingText = lines[0].replace(/^#+\s/, "");
          if (level === 1) {
            return (
              <h2
                key={idx}
                className="font-display text-lg font-bold text-[var(--ink)] pt-2 border-b border-[var(--border)] pb-1"
              >
                {headingText}
              </h2>
            );
          }
          if (level === 2) {
            return (
              <h3
                key={idx}
                className="font-display text-base font-bold text-[var(--ink)] pt-1"
              >
                {headingText}
              </h3>
            );
          }
          return (
            <h4
              key={idx}
              className="font-display text-sm font-semibold text-[var(--ink)] pt-1"
            >
              {headingText}
            </h4>
          );
        }

        // Bullet lists
        if (lines.every((line) => /^[-*]\s/.test(line))) {
          return (
            <ul key={idx} className="list-disc space-y-1 pl-5 text-[var(--ink)]">
              {lines.map((line, lidx) => (
                <li key={lidx}>{renderInline(line.replace(/^[-*]\s/, ""))}</li>
              ))}
            </ul>
          );
        }

        // Numbered list
        if (lines.every((line) => /^\d+\.\s/.test(line))) {
          return (
            <ol key={idx} className="list-decimal space-y-1 pl-5 text-[var(--ink)]">
              {lines.map((line, lidx) => (
                <li key={lidx}>{renderInline(line.replace(/^\d+\.\s/, ""))}</li>
              ))}
            </ol>
          );
        }

        return <p key={idx}>{renderInline(block)}</p>;
      })}
    </div>
  );
}

export function ChatMessage({
  message,
  isLatestAssistant,
  onRegenerate,
  onFollowUpClick,
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 max-w-4xl mx-auto py-2">
        <div className="max-w-[85%] rounded-3xl rounded-tr-sm bg-[var(--ink)] text-[var(--bg)] px-5 py-3.5 text-sm shadow-sm leading-relaxed">
          {message.content}
        </div>
        <div className="h-8 w-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0 text-[var(--ink-muted)]">
          <User size={15} />
        </div>
      </div>
    );
  }

  // Assistant Message
  return (
    <div className="flex gap-3 max-w-4xl mx-auto py-3">
      <div className="h-8 w-8 rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] border border-[var(--accent)]/30 flex items-center justify-center shrink-0">
        <Sparkles size={16} />
      </div>

      <div className="flex-1 space-y-3 min-w-0">
        {/* Assistant Content Bubble */}
        <div className="rounded-3xl rounded-tl-sm border border-[var(--border)] bg-[var(--surface)] p-5 lg:p-6 shadow-sm">
          <MarkdownRenderer content={message.content} />

          {/* Contextual Action Links */}
          {message.suggestedActions && message.suggestedActions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-wrap gap-2">
              <span className="text-xs font-semibold text-[var(--ink-muted)] flex items-center gap-1">
                Contextual actions:
              </span>
              {message.suggestedActions.map((action, i) => (
                <Link
                  key={i}
                  to={action.url}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[var(--accent-soft)] text-[var(--accent-strong)] border border-[var(--accent)]/30 hover:bg-[var(--accent)] hover:text-white transition-all shadow-sm cursor-pointer"
                >
                  <span>{action.label}</span>
                  <ArrowRight size={12} />
                </Link>
              ))}
            </div>
          )}

          {/* Suggested Follow-up Prompts */}
          {message.followUpQuestions && message.followUpQuestions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[var(--border)] space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                Suggested Follow-Ups:
              </span>
              <div className="flex flex-wrap gap-2">
                {message.followUpQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onFollowUpClick(q)}
                    className="text-left text-xs px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent-strong)] transition-all cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Message Footnotes & Utility Actions */}
        <div className="flex items-center gap-3 px-2 text-xs text-[var(--ink-muted)]">
          <button
            type="button"
            onClick={copyMessage}
            className="flex items-center gap-1 hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy</span>
              </>
            )}
          </button>

          {isLatestAssistant && (
            <button
              type="button"
              onClick={onRegenerate}
              className="flex items-center gap-1 hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Regenerate response</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Code,
  X,
  Bug,
  Sparkles,
  Clock,
  HardDrive,
  Copy,
  ArrowRightLeft,
  CheckCircle2,
  FileCode,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CodeWorkspaceModal({
  isOpen,
  onClose,
  initialCode = "",
  initialLanguage = "javascript",
  analysisResult,
  isLoading,
  onRunAnalysis,
  onInsertCode,
}) {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [targetLang, setTargetLang] = useState("python");
  const [activeAction, setActiveAction] = useState("explain");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteAction = (action) => {
    setActiveAction(action);
    onRunAnalysis({ code, language, action, targetLanguage: targetLang });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col justify-between overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Code size={16} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[var(--ink)]">
                Code Learning & Complexity Workspace
              </h3>
              <p className="text-xs text-[var(--ink-muted)]">
                Algorithm inspection, Big-O derivations, bug detection, and cross-language translation.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-[var(--ink-muted)]">
            <X size={16} />
          </button>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleExecuteAction("explain")}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeAction === "explain"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              <Sparkles size={13} />
              <span>Explain Logic</span>
            </button>

            <button
              onClick={() => handleExecuteAction("complexity")}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeAction === "complexity"
                  ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                  : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              <Clock size={13} />
              <span>Time & Space Big-O</span>
            </button>

            <button
              onClick={() => handleExecuteAction("bugs")}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeAction === "bugs"
                  ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                  : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              <Bug size={13} />
              <span>Find Bugs & Pitfalls</span>
            </button>

            <button
              onClick={() => handleExecuteAction("test_cases")}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeAction === "test_cases"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              <Terminal size={13} />
              <span>Generate Test Cases</span>
            </button>

            <button
              onClick={() => handleExecuteAction("convert")}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeAction === "convert"
                  ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                  : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              <ArrowRightLeft size={13} />
              <span>Convert Language</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="sql">SQL</option>
              <option value="go">Go</option>
              <option value="typescript">TypeScript</option>
            </select>

            {activeAction === "convert" && (
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 focus:outline-none"
              >
                <option value="python">To Python</option>
                <option value="cpp">To C++</option>
                <option value="java">To Java</option>
                <option value="javascript">To JavaScript</option>
                <option value="go">To Go</option>
              </select>
            )}
          </div>
        </div>

        {/* 2-Pane Editor & Output Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto min-h-[320px]">
          {/* Left: Code Input */}
          <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[#12141a] overflow-hidden">
            <div className="px-3 py-2 bg-[#1b1e26] border-b border-[var(--border)] flex items-center justify-between text-[11px] text-gray-400">
              <span className="font-mono flex items-center gap-1.5">
                <FileCode size={13} />
                <span>Input Code ({language})</span>
              </span>
              <button
                onClick={() => handleCopy(code)}
                className="hover:text-white transition-colors"
                title="Copy code"
              >
                <Copy size={13} />
              </button>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste or type code snippet here..."
              className="flex-1 w-full p-3 font-mono text-xs text-emerald-400 bg-transparent border-none focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Right: AI Analysis Output */}
          <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 overflow-hidden">
            <div className="px-3 py-2 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
              <span className="font-semibold flex items-center gap-1.5 text-[var(--ink)]">
                <Sparkles size={13} className="text-blue-400" />
                <span>AI Code Analysis</span>
              </span>
              {analysisResult && (
                <button
                  onClick={() => handleCopy(analysisResult.explanation || analysisResult.convertedCode)}
                  className="hover:text-[var(--ink)] transition-colors"
                >
                  <Copy size={13} />
                </button>
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs text-[var(--ink)]">
              {isLoading ? (
                <div className="p-8 text-center space-y-2">
                  <Sparkles size={24} className="mx-auto text-blue-400 animate-spin" />
                  <div className="text-xs font-bold text-[var(--ink)]">Analyzing code structures & Big-O bounds...</div>
                </div>
              ) : !analysisResult ? (
                <div className="p-8 text-center text-xs text-[var(--ink-muted)]">
                  Click any action above (Explain Logic, Big-O Complexity, Find Bugs, Test Cases) to run AI analysis.
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Complexity Badges */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <div className="text-[10px] font-bold text-purple-400 uppercase flex items-center gap-1">
                        <Clock size={11} />
                        <span>Time Complexity</span>
                      </div>
                      <div className="text-xs font-bold text-[var(--ink)] mt-0.5">
                        {analysisResult.timeComplexity}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <div className="text-[10px] font-bold text-blue-400 uppercase flex items-center gap-1">
                        <HardDrive size={11} />
                        <span>Space Complexity</span>
                      </div>
                      <div className="text-xs font-bold text-[var(--ink)] mt-0.5">
                        {analysisResult.spaceComplexity}
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  {analysisResult.explanation && (
                    <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
                      <div className="text-[10px] uppercase font-bold text-[var(--ink-muted)]">Logic Breakdown</div>
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{analysisResult.explanation}</p>
                    </div>
                  )}

                  {/* Potential Bugs */}
                  {analysisResult.potentialBugs?.length > 0 && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1">
                        <Bug size={11} />
                        <span>Potential Edge Cases & Bugs</span>
                      </div>
                      <ul className="space-y-1">
                        {analysisResult.potentialBugs.map((bug, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-rose-300">
                            <span>•</span>
                            <span>{bug}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Converted Code */}
                  {analysisResult.convertedCode && (
                    <div className="p-3 rounded-xl bg-[#12141a] border border-[var(--border)] space-y-1">
                      <div className="text-[10px] uppercase font-bold text-amber-400">
                        Translated Code ({targetLang})
                      </div>
                      <pre className="font-mono text-xs text-amber-300 whitespace-pre-wrap overflow-x-auto">
                        {analysisResult.convertedCode}
                      </pre>
                    </div>
                  )}

                  {/* Test Cases */}
                  {analysisResult.testCases?.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-[var(--ink-muted)]">Unit Test Scenarios</div>
                      {analysisResult.testCases.map((tc, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[11px] font-mono">
                          <div><strong>Input:</strong> {tc.input}</div>
                          <div><strong>Expected:</strong> {tc.expectedOutput}</div>
                          <div className="text-[10px] text-[var(--ink-muted)] italic font-sans">{tc.reason}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between shrink-0">
          <Button variant="outline" onClick={onClose} className="rounded-xl text-xs">
            Close
          </Button>

          <Button
            onClick={() => {
              const codeBlock = `\n\`\`\`${language}\n${code}\n\`\`\`\n`;
              onInsertCode(codeBlock);
              onClose();
            }}
            className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
          >
            Insert Code in Document
          </Button>
        </div>
      </motion.div>
    </div>
  );
}


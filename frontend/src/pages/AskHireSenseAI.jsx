import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInputBar } from "@/components/chat/ChatInputBar";
import {
  getConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  sendMessage,
} from "@/api/chat";
import { Sparkles, MessageSquare, Menu, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AskHireSenseAI() {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeId, setActiveId] = useState(conversationId || null);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, isGenerating]);

  // Load conversation list
  const fetchConversations = async (selectId = null) => {
    try {
      const res = await getConversations();
      if (res?.conversations) {
        setConversations(res.conversations);

        const targetId = selectId || activeId;
        if (targetId) {
          fetchSingleConversation(targetId);
        } else if (res.conversations.length > 0 && !selectId) {
          // Select most recent conversation by default
          fetchSingleConversation(res.conversations[0]._id);
        } else {
          setActiveConversation(null);
          setActiveId(null);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
      setError("Could not load conversations.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleConversation = async (id) => {
    try {
      setError(null);
      const res = await getConversation(id);
      if (res?.conversation) {
        setActiveConversation(res.conversation);
        setActiveId(id);
        navigate(`/ask-hiresense-ai/${id}`, { replace: true });
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
      setActiveConversation(null);
      setActiveId(null);
    }
  };

  useEffect(() => {
    fetchConversations(conversationId);
  }, [conversationId]);

  const handleSelectConversation = (id) => {
    setMobileSidebarOpen(false);
    fetchSingleConversation(id);
  };

  const handleNewChat = () => {
    setMobileSidebarOpen(false);
    setActiveId(null);
    setActiveConversation(null);
    navigate("/ask-hiresense-ai", { replace: true });
  };

  const handleRename = async (id, newTitle) => {
    try {
      const res = await updateConversation(id, { title: newTitle });
      if (res?.conversation) {
        setConversations((prev) =>
          prev.map((c) => (c._id === id ? { ...c, title: newTitle } : c))
        );
        if (activeConversation?._id === id) {
          setActiveConversation((prev) => ({ ...prev, title: newTitle }));
        }
      }
    } catch (err) {
      console.error("Failed to rename conversation:", err);
    }
  };

  const handleTogglePin = async (id, isPinned) => {
    try {
      const res = await updateConversation(id, { isPinned });
      if (res?.conversation) {
        setConversations((prev) =>
          prev.map((c) => (c._id === id ? { ...c, isPinned } : c))
        );
        if (activeConversation?._id === id) {
          setActiveConversation((prev) => ({ ...prev, isPinned }));
        }
      }
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (activeId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleSend = async (messageText = null) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isGenerating) return;

    setInput("");
    setIsGenerating(true);
    setError(null);

    try {
      if (!activeId) {
        // Create new conversation with first message
        const res = await createConversation({ initialMessage: textToSend });
        if (res?.conversation) {
          setActiveConversation(res.conversation);
          setActiveId(res.conversation._id);
          setConversations((prev) => [
            {
              _id: res.conversation._id,
              title: res.conversation.title,
              isPinned: false,
              lastMessageAt: new Date().toISOString(),
              messageCount: res.conversation.messages.length,
            },
            ...prev,
          ]);
          navigate(`/ask-hiresense-ai/${res.conversation._id}`, { replace: true });
        }
      } else {
        // Optimistic UI update
        const tempUserMsg = {
          id: `temp_${Date.now()}`,
          role: "user",
          content: textToSend,
          createdAt: new Date().toISOString(),
        };

        setActiveConversation((prev) => ({
          ...prev,
          messages: [...(prev?.messages || []), tempUserMsg],
        }));

        const res = await sendMessage(activeId, textToSend);
        if (res?.conversation) {
          setActiveConversation(res.conversation);
          setConversations((prev) =>
            prev.map((c) =>
              c._id === activeId
                ? {
                    ...c,
                    title: res.conversation.title,
                    lastMessageAt: res.conversation.lastMessageAt,
                    messageCount: res.conversation.messages.length,
                  }
                : c
            )
          );
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to get response. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!activeConversation?.messages || activeConversation.messages.length < 2) return;
    const messages = activeConversation.messages;
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage) {
      handleSend(lastUserMessage.content);
    }
  };

  const messages = activeConversation?.messages || [];
  const showStarters = !activeConversation || messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4 overflow-hidden py-1">
      {/* Desktop Conversation Sidebar */}
      <div className="hidden md:block">
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={activeId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onRenameConversation={handleRename}
          onTogglePin={handleTogglePin}
          onDeleteConversation={handleDelete}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-sm">
          <div className="w-80 h-full bg-[var(--surface)] p-3">
            <div className="flex justify-end p-2">
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[var(--surface-2)]"
              >
                <X size={18} />
              </button>
            </div>
            <ConversationSidebar
              conversations={conversations}
              activeConversationId={activeId}
              onSelectConversation={handleSelectConversation}
              onNewChat={handleNewChat}
              onRenameConversation={handleRename}
              onTogglePin={handleTogglePin}
              onDeleteConversation={handleDelete}
            />
          </div>
        </div>
      )}

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-card overflow-hidden">
        {/* Workspace Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)]"
            >
              <Menu size={16} />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)] border border-[var(--accent)]/30">
                <Sparkles size={18} />
              </div>
              <div>
                <h1 className="font-display font-bold text-base text-[var(--ink)] leading-snug">
                  {activeConversation?.title || "Ask HireSense AI"}
                </h1>
                <p className="text-xs text-[var(--ink-muted)]">
                  Personal AI Career, Coding & Interview Assistant
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-4 custom-scrollbar">
          {showStarters ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-4">
              <div className="h-14 w-14 rounded-3xl bg-[var(--accent-soft)] text-[var(--accent-strong)] border border-[var(--accent)]/30 flex items-center justify-center shadow-sm">
                <Sparkles size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-[var(--ink)] tracking-tight">
                  How can I help your career today?
                </h2>
                <p className="text-sm text-[var(--ink-muted)] mt-1.5 leading-relaxed">
                  I can review resume sections, explain technical and system design concepts, walk through DSA questions, or analyze missing skills grounded in your profile.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const isLatestAssistant =
                  msg.role === "assistant" && index === messages.length - 1;

                return (
                  <ChatMessage
                    key={msg.id || index}
                    message={msg}
                    isLatestAssistant={isLatestAssistant}
                    onRegenerate={handleRegenerate}
                    onFollowUpClick={(q) => handleSend(q)}
                  />
                );
              })}

              {isGenerating && (
                <div className="flex gap-3 max-w-4xl mx-auto py-3">
                  <div className="h-8 w-8 rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] flex items-center justify-center shrink-0">
                    <Sparkles size={16} className="animate-spin" />
                  </div>
                  <div className="p-4 rounded-3xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink-muted)] flex items-center gap-2">
                    <span className="animate-pulse">Thinking & synthesizing grounded insights...</span>
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="max-w-4xl mx-auto p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)] shrink-0">
          <ChatInputBar
            input={input}
            setInput={setInput}
            onSend={() => handleSend()}
            isGenerating={isGenerating}
            onStop={() => setIsGenerating(false)}
            showStarters={showStarters}
            onSelectStarter={(p) => handleSend(p)}
          />
        </div>
      </div>
    </div>
  );
}


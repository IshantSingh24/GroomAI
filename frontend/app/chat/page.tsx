"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/lib/config";
import { Navbar } from "@/components/navbar";
import { SessionsSidebar, Session } from "@/components/advisor/sessions-sidebar";
import { SkinAssessmentForm } from "@/components/advisor/skin-assessment-form";
import { RoutineBento } from "@/components/advisor/routine-bento";
import { RagSearchingBeam } from "@/components/advisor/rag-searching-beam";
import { parseRoutineResponse } from "@/lib/routine-parser";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Camera,
  X,
  Sparkles,
  SlidersHorizontal,
  Bot,
  User as UserIcon,
  Box,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  HelpCircle,
} from "lucide-react";

type ChatMessage = { role: "user" | "ai"; text: string };
type InventoryItem = { id: number; item_name: string; item_price: number; reason?: string };

const MAX_SESSIONS = 10;
const STORAGE_KEY = "groomai_sessions";

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function autoName(firstMessage: string): string {
  const words = firstMessage.trim().split(/\s+/).slice(0, 5).join(" ");
  return words.length < firstMessage.trim().length ? words + "…" : words;
}

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export default function ChatPage() {
  const router = useRouter();

  // Auth State
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // Sessions State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // Layout & UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const messages = activeSession?.messages ?? [];

  // ── Bootstrap Auth & Sessions ──────────────────────────────────────────
  useEffect(() => {
    const tok = localStorage.getItem("groomai_token");
    const em = localStorage.getItem("groomai_email");
    if (!tok || !em) {
      router.replace("/sign-in");
      return;
    }
    setToken(tok);
    setEmail(em);

    const stored = loadSessions();
    setSessions(stored);

    if (stored.length > 0) {
      setActiveSessionId(stored[0].id);
    } else {
      createNewSession(stored);
    }
  }, [router]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Inventory fetching
  const fetchInventory = useCallback(async (tok: string, userEmail: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/inventory/`, {
        headers: { Authorization: `Bearer ${tok}`, "x-user-email": userEmail },
      });
      if (res.ok) setInventory(await res.json());
    } catch {
      /* silent failover */
    }
  }, []);

  useEffect(() => {
    if (token && email) fetchInventory(token, email);
  }, [token, email, fetchInventory]);

  // ── Session Management ─────────────────────────────────────────────────
  function createNewSession(existing?: Session[]): string {
    const id = generateId();
    const session: Session = {
      id,
      name: "New Consultation",
      messages: [],
      createdAt: Date.now(),
    };
    setSessions((prev) => {
      const base = existing ?? prev;
      const updated = [session, ...base].slice(0, MAX_SESSIONS);
      saveSessions(updated);
      return updated;
    });
    setActiveSessionId(id);
    setShowAssessmentForm(false);
    return id;
  }

  function updateSessions(updated: Session[]) {
    setSessions(updated);
    saveSessions(updated);
  }

  function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== id);
    updateSessions(updated);
    if (activeSessionId === id) {
      if (updated.length > 0) setActiveSessionId(updated[0].id);
      else createNewSession(updated);
    }
  }

  function startRename(session: Session, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingName(session.name);
  }

  function commitRename(id: string) {
    if (!editingName.trim()) {
      setEditingSessionId(null);
      return;
    }
    const updated = sessions.map((s) =>
      s.id === id ? { ...s, name: editingName.trim() } : s
    );
    updateSessions(updated);
    setEditingSessionId(null);
  }

  function setSessionMessages(sessionId: string, msgs: ChatMessage[]) {
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === sessionId ? { ...s, messages: msgs } : s));
      saveSessions(updated);
      return updated;
    });
  }

  function autoNameSession(sessionId: string, firstMessage: string) {
    const name = autoName(firstMessage);
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === sessionId ? { ...s, name } : s));
      saveSessions(updated);
      return updated;
    });
  }

  // ── Image Handling ─────────────────────────────────────────────────────
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Send Message & Stream Advice ───────────────────────────────────────
  async function sendMessage(overrideText?: string) {
    const text = overrideText ?? message;
    if (!text.trim() && !imageFile) return;
    if (!token || !email) return;

    const sessionId = activeSessionId ?? createNewSession();
    const currentSession = sessions.find((s) => s.id === sessionId);
    const currentMessages = currentSession?.messages ?? [];

    if (currentMessages.length === 0 && text.trim()) {
      autoNameSession(sessionId, text);
    }

    const userMsg: ChatMessage = { role: "user", text };
    const newMessages = [...currentMessages, userMsg];
    setSessionMessages(sessionId, newMessages);
    setMessage("");
    setShowAssessmentForm(false);
    setLoading(true);

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      let imageBase64: string | null = null;
      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        const r = await fetch(`${BACKEND_URL}/upload`, { method: "POST", body: fd });
        if (!r.ok) throw new Error("Failed to upload image.");
        const d = await r.json();
        imageBase64 = d.image_base64;
        clearImage();
      }

      const recentHistory = newMessages.slice(-5);

      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-email": email,
        },
        body: JSON.stringify({
          message: text,
          image_base64: imageBase64,
          history: recentHistory,
        }),
      });

      if (!res.ok) {
        let errDetail = "";
        try {
          const d = await res.json();
          errDetail =
            typeof d?.detail === "string"
              ? d.detail
              : Array.isArray(d?.detail)
              ? d.detail.map((i: any) => i.msg || JSON.stringify(i)).join(", ")
              : "";
        } catch {
          /* ignore */
        }
        throw new Error(errDetail || `Server error (${res.status}).`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let aiText = "";

      const withAi = [...newMessages, { role: "ai" as const, text: "" }];
      setSessionMessages(sessionId, withAi);

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        aiText += decoder.decode(value);
        setSessionMessages(sessionId, [
          ...newMessages,
          { role: "ai", text: aiText },
        ]);
      }

      fetchInventory(token, email);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Network error. Please try again.";
      setSessionMessages(sessionId, [
        ...newMessages,
        { role: "ai", text: `⚠️ **Error**: ${errMsg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const suggestionPills = [
    "Build a morning & night routine for oily, acne-prone skin under ₹1500",
    "Can I use Salicylic Acid with Niacinamide in the same routine?",
    "Best non-comedogenic sunscreen for humid Indian weather?",
    "How do I repair a damaged skin barrier from over-exfoliation?",
  ];

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden font-sans">
      {/* Top Clinical Navbar */}
      <Navbar
        email={email}
        showSidebarToggle={true}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sessions Sidebar */}
        <SessionsSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onNewSession={() => createNewSession()}
          onDeleteSession={deleteSession}
          editingSessionId={editingSessionId}
          editingName={editingName}
          setEditingName={setEditingName}
          onStartRename={startRename}
          onCommitRename={commitRename}
          onCancelRename={() => setEditingSessionId(null)}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          inventoryCount={inventory.length}
          onOpenInventory={() => setShowInventoryModal(true)}
        />

        {/* Main Consultation Workspace */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Active Consultation Bar */}
          <div className="bg-white/80 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#4C7359]" />
              <span className="font-semibold text-xs text-slate-800">
                {activeSession?.name || "Consultation"}
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">•</span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Evidence-Based Dermatological Memory
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAssessmentForm(!showAssessmentForm)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                  showAssessmentForm
                    ? "bg-[#4C7359] text-white border-[#4C7359] shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {showAssessmentForm ? "Hide Assessment Form" : "Open Skin Assessment Form"}
              </button>
            </div>
          </div>

          {/* Messages & Advisor Stream View */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Expandable Skin Assessment Form */}
            {showAssessmentForm && (
              <div className="max-w-3xl mx-auto mb-6">
                <SkinAssessmentForm
                  isLoading={loading}
                  onSubmit={(prompt) => {
                    sendMessage(prompt);
                  }}
                />
              </div>
            )}

            {/* Empty State Greeting */}
            {messages.length === 0 && !showAssessmentForm && (
              <div className="max-w-2xl mx-auto text-center py-10 sm:py-16 space-y-6">
                <div className="h-14 w-14 rounded-3xl bg-[#4C7359]/10 border border-[#4C7359]/20 text-[#4C7359] flex items-center justify-center mx-auto shadow-xs">
                  <Sparkles className="h-7 w-7" />
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Clinical Skincare Advisor
                  </h2>
                  <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                    Tell me your skin type, current breakout concerns, or upload a photo. I will cross-reference evidence-based dermatology formulations and your personal shelf.
                  </p>
                </div>

                {/* Quick Suggestion Pills */}
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Quick Consultation Starters
                  </div>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-center">
                    {suggestionPills.map((pill, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(pill)}
                        className="text-left px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 hover:border-[#4C7359]/40 hover:bg-[#4C7359]/5 text-xs text-slate-700 hover:text-[#3E6049] transition-all duration-200 hover:-translate-y-0.5 shadow-xs"
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Messages Thread */}
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              const isAi = msg.role === "ai";
              const parsed = isAi ? parseRoutineResponse(msg.text) : null;

              return (
                <div
                  key={index}
                  className={`flex gap-3 max-w-4xl mx-auto ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div className="h-8 w-8 rounded-xl bg-[#4C7359] text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-xs">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`space-y-2 max-w-2xl ${isUser ? "items-end" : "w-full"}`}>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                      <span>{isUser ? "You" : "GroomAI Clinical Agent"}</span>
                    </div>

                    {isUser ? (
                      <div className="bg-[#4C7359] text-white px-4 py-3 rounded-2xl rounded-tr-xs text-sm leading-relaxed shadow-sm">
                        {msg.text}
                      </div>
                    ) : (
                      <div className="w-full">
                        {parsed?.hasRoutine ? (
                          <RoutineBento routine={parsed} />
                        ) : (
                          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 text-sm text-slate-800 leading-relaxed shadow-xs prose prose-slate max-w-none">
                            {msg.text || (
                              <span className="text-slate-400 italic">Thinking...</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="h-8 w-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-1 shadow-xs">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Live Loading / Animated Beam State */}
            {loading && (
              <div className="max-w-3xl mx-auto py-2">
                <RagSearchingBeam status="Querying FAISS vector index & matching active ingredients..." />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-20">
            <div className="max-w-4xl mx-auto space-y-2">
              {/* Image Preview Thumbnail */}
              {imagePreview && (
                <div className="inline-flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700">
                  <img
                    src={imagePreview}
                    alt="Skin preview"
                    className="h-9 w-9 object-cover rounded-lg border border-slate-200"
                  />
                  <span className="truncate max-w-xs">{imageFile?.name}</span>
                  <button
                    onClick={clearImage}
                    className="p-1 hover:text-red-600 rounded-full hover:bg-slate-200 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Chat Form */}
              <div className="flex items-end gap-2 bg-slate-50 border border-slate-200/90 rounded-2xl p-2 focus-within:border-[#4C7359] focus-within:ring-2 focus-within:ring-[#4C7359]/20 transition-all duration-200 shadow-xs">
                {/* Photo Upload Trigger */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  className="hidden"
                  id="skin-photo-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 transition-colors flex-shrink-0"
                  title="Upload skin / product photo for vision analysis"
                >
                  <Camera className="h-5 w-5" />
                </button>

                {/* Text Area */}
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ask a question or describe your skin condition (e.g. 'morning routine for oily skin under ₹1500')..."
                  className="flex-1 bg-transparent border-0 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none py-2 px-1 max-h-32 min-h-[40px] leading-relaxed"
                  rows={1}
                />

                {/* Send Button */}
                <button
                  type="button"
                  disabled={loading || (!message.trim() && !imageFile)}
                  onClick={() => sendMessage()}
                  className="p-2.5 rounded-xl bg-[#4C7359] text-white hover:bg-[#3E6049] disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 hover:-translate-y-0.5 shadow-xs flex-shrink-0"
                  title="Send consultation message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <span>Powered by FAISS RAG & OpenAI Agents</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Skincare Wardrobe / Inventory Modal */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Box className="h-5 w-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Your Skincare Wardrobe
                </h3>
              </div>
              <button
                onClick={() => setShowInventoryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              GroomAI checks these products before recommending new items to prevent duplicate purchases.
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {inventory.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No products registered yet. Mention items you own in the chat (e.g. &ldquo;I already have Sebamed foam cleanser&rdquo;) and GroomAI will add them.
                </div>
              ) : (
                inventory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{item.item_name}</div>
                      {item.reason && (
                        <div className="text-[11px] text-slate-500">{item.reason}</div>
                      )}
                    </div>
                    <span className="font-bold text-[#3E6049] bg-[#4C7359]/10 px-2 py-0.5 rounded-md">
                      ₹{item.item_price}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowInventoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

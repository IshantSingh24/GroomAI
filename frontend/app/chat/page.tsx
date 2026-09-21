"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { BACKEND_URL } from "@/lib/config";

// ── Types ──────────────────────────────────────────────────────────────────
type ChatMessage = { role: "user" | "ai"; text: string };

type Session = {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: number;
};

type InventoryItem = { id: number; item_name: string; item_price: number };

const MAX_SESSIONS = 10;
const STORAGE_KEY = "groomai_sessions";

// ── Helpers ────────────────────────────────────────────────────────────────
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

// ── Icons (inline SVG) ────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="7" y1="1" x2="7" y2="13" /><line x1="1" y1="7" x2="13" y2="7" />
  </svg>
);

const IconChat = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconPencil = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconTrash = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

const IconMenu = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const IconSend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const IconCamera = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

// ── Component ──────────────────────────────────────────────────────────────
export default function ChatPage() {
  const router = useRouter();

  // Auth
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // UI
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Computed
  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const messages = activeSession?.messages ?? [];

  // ── Bootstrap ──────────────────────────────────────────────────────────
  useEffect(() => {
    const tok = localStorage.getItem("groomai_token");
    const em = localStorage.getItem("groomai_email");
    if (!tok || !em) { router.replace("/sign-in"); return; }
    setToken(tok);
    setEmail(em);

    const stored = loadSessions();
    setSessions(stored);

    // Auto-select or create session
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

  // Focus edit input
  useEffect(() => {
    if (editingSessionId) editInputRef.current?.focus();
  }, [editingSessionId]);

  // Inventory
  const fetchInventory = useCallback(async (tok: string, userEmail: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/inventory/`, {
        headers: { Authorization: `Bearer ${tok}`, "x-user-email": userEmail },
      });
      if (res.ok) setInventory(await res.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (token && email) fetchInventory(token, email);
  }, [token, email, fetchInventory]);

  // ── Session management ─────────────────────────────────────────────────
  function createNewSession(existing?: Session[]): string {
    const id = generateId();
    const session: Session = { id, name: "New Chat", messages: [], createdAt: Date.now() };
    setSessions((prev) => {
      const base = existing ?? prev;
      const updated = [session, ...base].slice(0, MAX_SESSIONS);
      saveSessions(updated);
      return updated;
    });
    setActiveSessionId(id);
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
    if (!editingName.trim()) { setEditingSessionId(null); return; }
    const updated = sessions.map((s) => s.id === id ? { ...s, name: editingName.trim() } : s);
    updateSessions(updated);
    setEditingSessionId(null);
  }

  function setSessionMessages(sessionId: string, msgs: ChatMessage[]) {
    setSessions((prev) => {
      const updated = prev.map((s) => s.id === sessionId ? { ...s, messages: msgs } : s);
      saveSessions(updated);
      return updated;
    });
  }

  function autoNameSession(sessionId: string, firstMessage: string) {
    const name = autoName(firstMessage);
    setSessions((prev) => {
      const updated = prev.map((s) => s.id === sessionId ? { ...s, name } : s);
      saveSessions(updated);
      return updated;
    });
  }

  // ── Send message ───────────────────────────────────────────────────────
  async function sendMessage(overrideText?: string) {
    const text = overrideText ?? message;
    if (!text.trim() && !imageFile) return;
    if (!token || !email) return;

    const sessionId = activeSessionId ?? createNewSession();
    const currentSession = sessions.find((s) => s.id === sessionId);
    const currentMessages = currentSession?.messages ?? [];

    // Auto-name on first message
    if (currentMessages.length === 0 && text.trim()) {
      autoNameSession(sessionId, text);
    }

    const userMsg: ChatMessage = { role: "user", text };
    const newMessages = [...currentMessages, userMsg];
    setSessionMessages(sessionId, newMessages);
    setMessage("");
    setLoading(true);

    // Auto-grow textarea reset
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
        setImageFile(null);
      }

      const recentHistory = newMessages.slice(-5);

      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-email": email,
        },
        body: JSON.stringify({ message: text, image_base64: imageBase64, history: recentHistory }),
      });

      if (!res.ok) {
        let errDetail = "";
        try {
          const d = await res.json();
          errDetail = typeof d?.detail === "string" ? d.detail
            : Array.isArray(d?.detail) ? d.detail.map((i: any) => i.msg || JSON.stringify(i)).join(", ")
            : "";
        } catch { /* ignore */ }
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setMessage(e.target.value);
    // Auto-grow
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 180) + "px";
  }

  function signOut() {
    localStorage.removeItem("groomai_token");
    localStorage.removeItem("groomai_email");
    document.cookie = "groomai_token=; path=/; max-age=0";
    router.push("/sign-in");
  }

  if (!token || !email) return null;

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
        {/* Top */}
        <div className="sidebar-top">
          <div className="brand">Groom<em>AI</em></div>
          <button className="new-chat-btn" onClick={() => createNewSession()}>
            <IconPlus /> New Chat
          </button>
        </div>

        {/* Session list */}
        <div className="sessions-label">Recent</div>
        <div className="sessions-list">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`session-item ${session.id === activeSessionId ? "active" : ""}`}
              onClick={() => setActiveSessionId(session.id)}
            >
              <span className="session-icon"><IconChat /></span>

              {editingSessionId === session.id ? (
                <input
                  ref={editInputRef}
                  className="session-edit-input"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => commitRename(session.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(session.id);
                    if (e.key === "Escape") setEditingSessionId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="session-name">{session.name}</span>
              )}

              <div className="session-actions">
                <button
                  className="session-action-btn"
                  title="Rename"
                  onClick={(e) => startRename(session, e)}
                >
                  <IconPencil />
                </button>
                <button
                  className="session-action-btn delete"
                  title="Delete"
                  onClick={(e) => deleteSession(session.id, e)}
                >
                  <IconTrash />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Inventory */}
        <div className="sidebar-inventory">
          <div className="sidebar-inventory-label">Wardrobe</div>
          {inventory.length === 0 ? (
            <p className="inv-empty">No products tracked yet</p>
          ) : (
            inventory.map((item) => (
              <div key={item.id} className="inv-item">
                <span className="inv-item-name">{item.item_name}</span>
                <span className="inv-item-price">₹{item.item_price}</span>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="chat-main">
        {/* Header */}
        <header className="chat-header">
          <div className="header-left">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen((o) => !o)}>
              <IconMenu />
            </button>
            <span className="session-title-display">
              {activeSession?.name ?? "GroomAI"}
            </span>
          </div>
          <div className="header-right">
            <div className="user-pill">{email}</div>
            <button className="sign-out-btn" onClick={signOut}>Sign out</button>
          </div>
        </header>

        {/* Messages */}
        <div className="messages-area" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-brand">Groom<em>AI</em></div>
              <p className="empty-sub">
                Your personal style & grooming advisor. Describe your skin, outfit, or upload a photo to begin.
              </p>
              <div className="empty-suggestions">
                {[
                  "Analyse my skin type",
                  "Suggest a grooming routine",
                  "What suits my face shape?",
                  "Review my current products",
                ].map((s) => (
                  <button key={s} className="suggestion-chip" onClick={() => sendMessage(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`msg-row ${m.role}`}>
                <div className={`msg-bubble ${m.role}`}>
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="msg-row ai">
              <div className="typing-indicator">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="input-section">
          <div className="input-wrapper">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about grooming, skin, style…"
              rows={1}
            />
            <div className="input-actions">
              <div className="input-left-actions">
                <label className="upload-btn" title="Upload photo">
                  <IconCamera />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </label>
                {imageFile && (
                  <div className="file-chip" title={imageFile.name}>
                    📷 {imageFile.name}
                  </div>
                )}
              </div>
              <button className="send-btn" onClick={() => sendMessage()} disabled={loading}>
                <IconSend /> Send
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState, KeyboardEvent, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useAuth, useUser, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

type ChatMessage = { role: "user" | "ai"; text: string };
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export default function ChatPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  async function sendMessage() {
    if (!message.trim() && !imageFile) return;
    const token = await getToken();
    if (!token || !user?.primaryEmailAddress?.emailAddress) return;

    const userMsg = message;
    setMessages((p) => [...p, { role: "user", text: userMsg }]);
    setMessage("");
    setLoading(true);

    let imageBase64: string | null = null;
    if (imageFile) {
      const fd = new FormData();
      fd.append("file", imageFile);
      const r = await fetch(`${BACKEND_URL}/upload`, { method: "POST", body: fd });
      const d = await r.json();
      imageBase64 = d.image_base64;
      setImageFile(null);
    }

    const res = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-clerk-user-email": user.primaryEmailAddress.emailAddress,
      },
      body: JSON.stringify({ message: userMsg, image_base64: imageBase64 }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let aiText = "";
    setMessages((p) => [...p, { role: "ai", text: "" }]);

    while (reader) {
      const { value, done } = await reader.read();
      if (done) break;
      aiText += decoder.decode(value);
      setMessages((p) => {
        const c = [...p];
        c[c.length - 1] = { role: "ai", text: aiText };
        return c;
      });
    }
    setLoading(false);
  }

  return (
    <>
      <SignedOut><RedirectToSignIn /></SignedOut>
      <SignedIn>
        <div className="chat-container">
          <div className="bg-grid" style={{ opacity: 0.1 }} />
          
          <div className="chat-window">
            <header className="chat-header">
              <h1>Groom<span>AI</span></h1>
              <div className="user-pill">{user?.primaryEmailAddress?.emailAddress}</div>
            </header>

            <div className="messages-area" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="empty-state">
                  <p>Upload a photo or describe your skin concerns to begin.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`msg-bubble ${m.role}`}>
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </div>
              ))}
              {loading && <div className="msg-bubble ai typing">GroomAI is analyzing...</div>}
            </div>

            <div className="input-area">
              <div className="input-wrapper">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder="Ask about your skin..."
                />
                <div className="actions">
                  <label className="icon-btn">
                    📷
                    <input type="file" hidden accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                  </label>
                  <button onClick={sendMessage} disabled={loading} className="send-btn">
                    {loading ? "..." : "Send"}
                  </button>
                </div>
              </div>
              {imageFile && <div className="file-tag">Selected: {imageFile.name}</div>}
            </div>
          </div>
        </div>
      </SignedIn>
    </>
  );
}
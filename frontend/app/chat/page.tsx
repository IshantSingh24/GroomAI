"use client";

import { useState, KeyboardEvent } from "react";
import {
  useAuth,
  useUser,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from "@clerk/nextjs";

type ChatMessage = {
  role: "user" | "ai";
  text: string;
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export default function ChatPage() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!message.trim() && !imageFile) return;

    const token = await getToken();
    if (!token) {
      alert("Not authenticated");
      return;
    }

    // Show user message instantly
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text:
          message ||
          (imageFile ? `📷 Image sent (${imageFile.name})` : ""),
      },
    ]);

    setLoading(true);

    try {
      let imageBase64: string | null = null;

      // 🔹 Upload image FIRST (one-time)
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);

        const uploadRes = await fetch(`${BACKEND_URL}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Image upload failed");
        }

        const uploadData = await uploadRes.json();
        imageBase64 = uploadData.image_base64;
      }

      // 🔹 Send chat
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          image_base64: imageBase64,
        }),
      });

      if (!res.ok) {
        throw new Error("Chat request failed");
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "ai", text: data.response },
      ]);
    } catch (err) {
      alert("Failed to send message");
    } finally {
      // ✅ RESET AFTER SEND (IMPORTANT)
      setMessage("");
      setImageFile(null);
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* 🚫 BLOCK UNAUTHENTICATED USERS */}
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>

      {/* ✅ AUTHENTICATED ONLY */}
      <SignedIn>
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white flex justify-center">
          <div className="w-full max-w-3xl flex flex-col p-6">

            <header className="mb-4 text-center">
              <h1 className="text-3xl font-bold">
                Groom<span className="text-emerald-400">AI</span>
              </h1>
              <p className="text-sm text-zinc-400">
                Logged in as {user?.primaryEmailAddress?.emailAddress}
              </p>
            </header>

            {/* CHAT MESSAGES */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[80%] px-4 py-2 rounded-xl ${
                    m.role === "user"
                      ? "ml-auto bg-emerald-600"
                      : "mr-auto bg-zinc-800"
                  }`}
                >
                  {m.text}
                </div>
              ))}

              {loading && (
                <div className="mr-auto bg-zinc-800 px-4 py-2 rounded-xl text-sm">
                  GroomAI is thinking…
                </div>
              )}
            </div>

            {/* INPUT AREA */}
            <div className="flex gap-2 items-end">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask GroomAI…"
                className="flex-1 resize-none rounded-lg bg-zinc-800 border border-zinc-700 p-3"
              />

              <label className="cursor-pointer bg-zinc-800 px-3 py-2 rounded-lg">
                📷
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) =>
                    setImageFile(e.target.files?.[0] || null)
                  }
                />
              </label>

              <button
                onClick={sendMessage}
                disabled={loading}
                className="bg-emerald-500 px-4 py-2 rounded-lg text-black font-semibold disabled:opacity-50"
              >
                Send
              </button>
            </div>

            {/* IMAGE PREVIEW (ONE-TIME) */}
            {imageFile && (
              <p className="text-xs text-zinc-400 mt-2">
                Selected image: {imageFile.name} (will be sent once)
              </p>
            )}
          </div>
        </div>
      </SignedIn>
    </>
  );
}

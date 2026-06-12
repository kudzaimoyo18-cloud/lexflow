"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = { sender: "ai" | "prospect"; body: string };

type Props = { firmName: string };

export function IntakeChat({ firmName }: Props) {
  const [leadId, setLeadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const controller = new AbortController();
    fetch("/api/intake/start", { method: "POST", signal: controller.signal })
      .then((r) => r.json())
      .then((data: { leadId: string; greeting: string }) => {
        setLeadId(data.leadId);
        setMessages([{ sender: "ai", body: data.greeting }]);
      })
      .catch(() => setError("Could not start the conversation. Refresh to retry."));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || !leadId || isSending || isDone) return;
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { sender: "prospect", body: text }]);
    setIsSending(true);
    try {
      const res = await fetch("/api/intake/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, message: text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { reply: string; done: boolean };
      setMessages((prev) => [...prev, { sender: "ai", body: data.reply }]);
      if (data.done) setIsDone(true);
    } catch {
      setError("Message failed to send. Try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-[600px] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-line bg-paper-raised shadow-lg">
      <div className="border-b border-line bg-navy px-5 py-4">
        <p className="font-display text-lg text-white">{firmName}</p>
        <p className="text-xs text-white/60">
          Intake assistant · replies in seconds, any hour
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.map((m, i) => (
          <div key={i} className={m.sender === "prospect" ? "flex justify-end" : "flex"}>
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                m.sender === "prospect"
                  ? "bg-navy text-white"
                  : "border border-line bg-paper text-ink"
              }`}
            >
              {m.body}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex">
            <div className="rounded-lg border border-line bg-paper px-4 py-2.5 text-sm text-ink-faint">
              typing…
            </div>
          </div>
        )}
        {error && <p className="text-center text-xs text-red">{error}</p>}
        {isDone && (
          <p className="rounded-md bg-green-soft px-3 py-2 text-center text-xs text-green">
            Intake complete — the attorney has been notified.
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-line p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={isDone ? "Conversation complete" : "Type your message…"}
            disabled={!leadId || isDone}
            className="flex-1 rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-bronze/60 disabled:opacity-50"
          />
          <button
            onClick={() => void send()}
            disabled={!input.trim() || isSending || isDone}
            className="rounded-md bg-bronze px-4 py-2.5 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Send
          </button>
        </div>
        <p className="mt-2 px-1 text-[10px] leading-relaxed text-ink-faint">
          This chat does not create an attorney-client relationship and is not legal advice.
        </p>
      </div>
    </div>
  );
}
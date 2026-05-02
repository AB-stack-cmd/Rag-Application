'use client'

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Main() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingMsg, setStreamingMsg] = useState("");
  const [pdfReady, setPdfReady] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMsg]);

  // ================= PDF UPLOAD =================
  async function handleFileUpload(file: File) {
    const formData = new FormData();
    formData.append("pdf", file);

    const res = await fetch("http://localhost:4000/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setJobId(data.jobId);

    // Polling
    const interval = setInterval(async () => {
      const status = await fetch(`http://localhost:4000/status/${data.jobId}`);
      const s = await status.json();

      if (s.ready) {
        setPdfReady(true);
        clearInterval(interval);
      }
    }, 2000);
  }

  // ================= STREAMING CHAT =================
  async function sendMessage() {
    if (!input.trim() || !pdfReady) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setStreamingMsg("");

    const res = await fetch(`http://localhost:4000/api/query/${jobId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: input }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    let done = false;
    let finalText = "";

    while (!done && reader) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;

      const chunk = decoder.decode(value || new Uint8Array());
      finalText += chunk;
      setStreamingMsg(finalText);
    }

    setMessages((prev) => [...prev, { role: "assistant", content: finalText }]);
    setStreamingMsg("");
    setLoading(false);
  }

  return (
    <div className="flex h-screen bg-black text-white">

      {/* Sidebar */}
      <div className="w-64 bg-[#111] border-r border-zinc-800 p-4 hidden md:flex flex-col">
        <button className="mb-4 bg-zinc-800 p-2 rounded-lg hover:bg-zinc-700">
          + New Chat
        </button>

        <div className="text-xs text-gray-400 mt-auto">
          PDF Mode: {pdfReady ? "Ready" : "Not Ready"}
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1">

        {/* Header */}
        <div className="border-b border-zinc-800 px-4 py-3 flex justify-between">
          <span>ChatGPT PDF</span>

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="text-sm"
          />
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-2xl px-4 py-3 rounded-xl text-sm ${
                msg.role === "user" ? "bg-blue-600" : "bg-zinc-800"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {streamingMsg && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 px-4 py-3 rounded-xl text-sm max-w-2xl">
                {streamingMsg}
              </div>
            </div>
          )}

          {loading && !streamingMsg && (
            <div className="text-gray-400 text-sm">Thinking...</div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-zinc-800 p-4">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={1}
              placeholder={pdfReady ? "Ask about your PDF..." : "Upload PDF first"}
              className="flex-1 resize-none rounded-lg bg-zinc-900 px-4 py-2 text-sm outline-none border border-zinc-700"
            />

            <button
              onClick={sendMessage}
              className="bg-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-500"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



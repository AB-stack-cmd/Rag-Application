'use client'

import { useState, useRef, useEffect } from "react";
import Sidebar from "./Sidebar";
import { conversations } from "./test/mockData";
import { ChatMessage } from "./ChatMessage";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fileName, setFileName] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

  // 🔥 Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMsg]);

  // ================= PDF UPLOAD =================
  async function handleFileUpload(file: File) {
    setPdfReady(false);
    setLoading(true);

    const formData = new FormData();
    formData.append("pdf", file);

    const res = await fetch("http://localhost:4000/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setJobId(data.jobId);

    // polling
    const interval = setInterval(async () => {
      const status = await fetch(`http://localhost:4000/status/${data.jobId}`);
      const s = await status.json();

      if (s.ready) {
        setPdfReady(true);
        setLoading(false);
        clearInterval(interval);
      }
    }, 1500);
  }

  // ================= STREAM =================
  async function sendMessage() {
    if (!input.trim() || !pdfReady) return;

    const userQuery = input;

    setMessages(prev => [...prev, { role: "user", content: userQuery }]);

    setInput("");
    setLoading(true);
    setStreamingMsg("");

    const res = await fetch(`http://localhost:4000/api/query/${jobId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: userQuery }),
    });

    if (!res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";
    let finalText = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const event = JSON.parse(line);

          if (event.type === "token") {
            finalText += event.content;
            setStreamingMsg(finalText);
          }

          if (event.type === "done") {
            setMessages(prev => [
              ...prev,
              { role: "assistant", content: finalText },
            ]);
            setStreamingMsg("");
            setLoading(false);
          }

        } catch (e) {
          console.error("Parse error:", e);
        }
      }
    }
  }

  // ✅ ENTER TO SEND
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-screen bg-[#212121] text-white">

      {/* SIDEBAR */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={conversations}
        activeId={1}
      />

      {/* MAIN */}
      <div className="flex flex-col flex-1">

        {/* HEADER */}
        <div className="h-12 border-b border-[#2a2a2a] flex items-center px-4 gap-3">

          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="p-2 rounded-md hover:bg-[#2a2a2a]"
          >
            ☰
          </button>

          <label className="cursor-pointer text-sm bg-[#2a2a2a] hover:bg-[#333] px-3 py-2 rounded-md transition">
            Upload PDF
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFileName(file.name);
                  handleFileUpload(file);
                }
              }}
            />
          </label>

          {fileName && (
            <span className="text-xs text-gray-400 truncate max-w-[180px]">
              {fileName}
            </span>
          )}
        </div>

        {/* CHAT */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`
                  px-4 py-3 rounded-xl text-sm leading-6 max-w-[80%]
                  ${msg.role === "user" ? "bg-blue-600" : "bg-[#2a2a2a]"}
                `}>
                  <ChatMessage content={msg.content} />
                </div>
              </div>
            ))}

            {/* STREAMING */}
            {streamingMsg && (
              <div className="flex justify-start">
                <div className="bg-[#2a2a2a] px-4 py-3 rounded-xl text-sm max-w-[80%]">
                  {streamingMsg}
                  <span className="animate-pulse"> ▍</span>
                </div>
              </div>
            )}

            {/* LOADING */}
            {loading && !streamingMsg && (
              <div className="text-gray-400 text-sm">Thinking...</div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* INPUT */}
        <div className="border-t border-[#2a2a2a] bg-[#212121] p-4">
          <div className="max-w-3xl mx-auto flex gap-2">

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={pdfReady ? "Ask anything..." : "Upload PDF first"}
              className="flex-1 resize-none rounded-xl bg-[#2a2a2a] px-4 py-3 text-sm outline-none"
            />

            <button
              onClick={sendMessage}
              disabled={!pdfReady || loading}
              className="bg-white text-black px-4 py-2 rounded-lg text-sm hover:opacity-80 disabled:opacity-40"
            >
              Send
            </button>
          </div>

          <div className="max-w-3xl mx-auto mt-2 text-xs text-gray-500">
            PDF Mode: {pdfReady ? "Ready" : "Upload PDF "}
          </div>
        </div>

      </div>
    </div>
  );
}
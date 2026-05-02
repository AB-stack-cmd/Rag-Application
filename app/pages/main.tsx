'use client'

import { stringify } from "querystring";
import { useState, useRef, useEffect, useCallback } from "react";

type MessageType = 'system' | 'user' | 'assistant';

interface Message {
  type: MessageType;
  content: string;
  timestamp: Date;
}

interface ConvEntry {
  role: 'user' | 'assistant';
  content: string;
}

export default function PDFChat() {
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const [uploadingStatus, setUploadingStatus] = useState("");
  const [convHistory, setConvHistory] = useState<ConvEntry[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const[jobId , setJobId] = useState()
  console.log(`JOB IDS : ${jobId}`)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const appendMessage = useCallback((type: MessageType, content: string) => {
    setMessages(prev => [...prev, { type, content, timestamp: new Date() }]);
  }, []);

  // Upload PDF to backend
  async function uploadPDF(selectedFile:File) {
    setFile(selectedFile);
    setUploadingStatus("Uploading...");
    setPdfReady(false);
    setConvHistory([]);

    appendMessage('system', `📄 Importing: ${selectedFile.name}`);

    

    try {
      const formData = new FormData();
      formData.append("pdf", selectedFile);

      console.log(formData)

      const res = await fetch("http://localhost:4000/upload", {
        method: "POST",
        body: formData,
      });

      const response  = await res.json()
      console.log(`Response from upload route : ${response.message} jobId : ${response.jobId}`)
      const new_jobId = response.jobId
      setJobId(response.jobId)

      console.log(`Job Id ${jobId}`)

      // setJobId(response.JobId)

      if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);

      setUploadingStatus("Processing PDF...");

      console.log(res);
      // Poll for ready status
      const interval = setInterval(async () => {
        try {
          const statusRes = await fetch(`http://localhost:4000/status/${response.jobId}`);
          
          const data = await statusRes.json();
          if (data.ready) {
            clearInterval(interval);
            setPdfReady(true);
            setUploadingStatus("");
            appendMessage('system', "✓ PDF loaded successfully. Ready for queries.");
          }
        } catch {
          clearInterval(interval);
          setUploadingStatus("");
          appendMessage('system', "❌ Status check failed.");
        }
      }, 2000);

    } catch (error) {
      setUploadingStatus("");
      setPdfReady(false);
      appendMessage('system', `❌ Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Query the PDF content
  async function queryPDF(query: string) {
    const updatedHistory: ConvEntry[] = [...convHistory, { role: 'user', content: query }];
    setConvHistory(updatedHistory);
    appendMessage('user', query);
    setLoading(true);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const res = await fetch(`http://localhost:4000/api/query/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, history: updatedHistory }),
      });

      if (!res.ok) throw new Error(`Query failed: ${res.statusText}`);

      const data = await res.json();
      const answer: string = data.answer ?? "No response received.";

      setConvHistory(prev => [...prev, { role: 'assistant', content: answer }]);
      appendMessage('assistant', answer);

    } catch (error) {
      appendMessage('assistant', `Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  // ADDING PDF DOCS
  async function  addDoc()  {
    const el = document.createElement("input");
    el.setAttribute('type',"file"); // SET TYPE
    el.setAttribute("accept","application/pdf"); // SET ACCEPT TYPE
    el.addEventListener("change",async (e)=>  {
      console.log(el.files?.[0].name)
      const selectedFile =el.files?.[0];
      
      if (!selectedFile) return;
      await uploadPDF(selectedFile);
    }) 
    el.click();
  }

  async function handleSubmit() {
    if (!text.trim() || !pdfReady || loading) return;
    await queryPDF(text.trim());
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  const canSend = pdfReady && text.trim() !== "" && !loading;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      display: 'flex',
      flexDirection: 'column',
      color: '#fff',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '16px 24px',
        background: '#111',
        borderBottom: '1px solid #1e1e1e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
            background: pdfReady ? '#00ff88' : '#ff4444',
            boxShadow: pdfReady ? '0 0 8px #00ff8888' : '0 0 8px #ff444488',
            transition: 'background 0.4s, box-shadow 0.4s',
          }} />
          <h1 style={{
            fontSize: 15, fontWeight: 700, letterSpacing: '1.5px',
            textTransform: 'uppercase', color: '#fff', margin: 0,
          }}>PDF Neural Net</h1>
        </div>

        <button
          onClick={addDoc}
          style={{
            padding: '9px 18px',
            background: 'linear-gradient(135deg, #ff0080, #7928ca)',
            border: 'none', borderRadius: 6,
            color: '#fff', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase',
            fontFamily: 'inherit', whiteSpace: 'nowrap',
            transition: 'opacity 0.2s, transform 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          ⬆ Import PDF
        </button>
      </div>

      {/* ── File bar ── */}
      {file && (
        <div style={{
          padding: '10px 24px',
          background: '#0d0d0d',
          borderBottom: '1px solid #1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          fontSize: 12,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#00ff88', minWidth: 0 }}>
            <span>▸</span>
            <span style={{
              whiteSpace: 'nowrap', overflow: 'hidden',
              textOverflow: 'ellipsis', fontWeight: 600,
            }}>{file.name}</span>
            <span style={{ color: '#555', flexShrink: 0 }}>|</span>
            <span style={{ color: '#555', flexShrink: 0 }}>{(file.size / 1024).toFixed(1)} KB</span>
          </div>

          {uploadingStatus && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ff0080', flexShrink: 0 }}>
              <div style={{
                width: 11, height: 11,
                border: '2px solid #ff0080', borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
              <span>{uploadingStatus}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Messages ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 24px',
        background: '#080808',
        backgroundImage: `
          linear-gradient(rgba(255,0,128,.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,0,128,.025) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {messages.length === 0 && !file && (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#444' }}>
              <div style={{ fontSize: 40, opacity: 0.25, marginBottom: 18 }}>⚡</div>
              <h2 style={{
                fontSize: 18, fontWeight: 700, letterSpacing: '2px',
                textTransform: 'uppercase', color: '#555', marginBottom: 8,
              }}>Initialize Protocol</h2>
              <p style={{ fontSize: 13, color: '#444' }}>Import a PDF document to begin neural analysis</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} style={{ animation: 'fadeUp 0.3s ease-out' }}>

              {msg.type === 'system' && (
                <div style={{
                  textAlign: 'center', padding: '10px 16px',
                  background: 'rgba(0,255,136,.05)',
                  border: '1px solid rgba(0,255,136,.18)',
                  borderRadius: 8, fontSize: 12, color: '#00ff88',
                }}>
                  {msg.content}
                </div>
              )}

              {msg.type === 'user' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 10 }}>
                  <div style={{
                    maxWidth: '68%', padding: '13px 17px',
                    background: 'linear-gradient(135deg, #ff0080, #7928ca)',
                    borderRadius: '14px 14px 4px 14px',
                    fontSize: 13, lineHeight: 1.65, wordBreak: 'break-word',
                  }}>
                    {msg.content}
                  </div>
                  <div style={{
                    width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                    background: 'linear-gradient(135deg,#ff0080,#7928ca)',
                    border: '1px solid rgba(255,0,128,.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                  }}>👤</div>
                </div>
              )}

              {msg.type === 'assistant' && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                    background: 'linear-gradient(135deg,#00ff88,#00ccff)',
                    border: '1px solid rgba(0,255,136,.4)',
                    boxShadow: '0 0 14px rgba(0,255,136,.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                  }}>🤖</div>
                  <div style={{
                    maxWidth: '68%', padding: '13px 17px',
                    background: '#141414', border: '1px solid #272727',
                    borderRadius: '14px 14px 14px 4px',
                    fontSize: 13, lineHeight: 1.75,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, animation: 'fadeUp 0.3s ease-out' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                background: 'linear-gradient(135deg,#00ff88,#00ccff)',
                border: '1px solid rgba(0,255,136,.4)',
                boxShadow: '0 0 14px rgba(0,255,136,.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
              }}>🤖</div>
              <div style={{
                padding: '14px 18px', background: '#141414',
                border: '1px solid #272727', borderRadius: 12,
                display: 'flex', gap: 5, alignItems: 'center',
              }}>
                {['-0.32s', '-0.16s', '0s'].map((delay, i) => (
                  <div key={i} style={{
                    width: 7, height: 7, background: '#00ff88', borderRadius: '50%',
                    animation: `bounce 1.3s ${delay} infinite ease-in-out both`,
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input area ── */}
      <div style={{
        padding: '16px 24px 20px',
        background: '#0d0d0d',
        borderTop: '1px solid #1a1a1a',
        flexShrink: 0,
      }}>
        <div style={{
          maxWidth: 860, margin: '0 auto',
          display: 'flex', alignItems: 'flex-end', gap: 10,
        }}>
          {/* Textarea */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={pdfReady ? "Enter your query..." : "Import a PDF to start"}
              disabled={!pdfReady}
              rows={1}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#161616',
                border: `1px solid ${text && pdfReady ? '#ff0080' : '#2a2a2a'}`,
                borderRadius: 8,
                fontSize: 13,
                fontFamily: 'inherit',
                color: '#fff',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.5,
                minHeight: 44,
                maxHeight: 120,
                overflowY: 'auto',
                display: 'block',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                cursor: pdfReady ? 'text' : 'not-allowed',
                opacity: pdfReady ? 1 : 0.45,
              }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={!canSend}
            style={{
              padding: '0 20px',
              height: 44,
              borderRadius: 8,
              border: `1px solid ${canSend ? '#00ff88' : '#333'}`,
              background: canSend
                ? 'linear-gradient(135deg, #00ff88, #00ccff)'
                : '#1a1a1a',
              color: canSend ? '#000' : '#555',
              fontSize: 13, fontWeight: 700,
              fontFamily: 'inherit',
              cursor: canSend ? 'pointer' : 'not-allowed',
              textTransform: 'uppercase', letterSpacing: '1px',
              whiteSpace: 'nowrap', flexShrink: 0,
              boxShadow: canSend ? '0 0 16px rgba(0,255,136,.28)' : 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (canSend) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(0,255,136,.45)'; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = canSend ? '0 0 16px rgba(0,255,136,.28)' : 'none'; }}
          >
            Send ⚡
          </button>
        </div>

        {!pdfReady && (
          <p style={{
            fontSize: 11, color: '#444', textAlign: 'center',
            margin: '10px 0 0',
          }}>
            ⚠ Neural network offline — Import PDF to activate
          </p>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40%           { transform: scale(1); }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #3a3a3a; }
        textarea:focus {
          border-color: #ff0080 !important;
          box-shadow: 0 0 0 2px rgba(255,0,128,.1);
        }
        textarea::placeholder { color: #444; }
      `}</style>
    </div>
  );
}
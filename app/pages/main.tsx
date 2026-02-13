'use client'
import { useState, useRef, useEffect } from "react";
import axios from "axios";

function Main() {
  const [file, setFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const [uploadingStatus, setUploadingStatus] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll for PDF processing status
  useEffect(() => {
    if (!file || pdfReady) return;
    
    const interval = setInterval(async () => {
      try {
        const response = await axios.get("http://localhost:4000/status");
        if (response.data.ready) {
          setPdfReady(true);
          setUploadingStatus("");
          setMessages(prev => [...prev, {
            type: 'system',
            content: `✓ PDF loaded successfully. Ready for queries.`,
            timestamp: new Date()
          }]);
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Error checking status:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [file, pdfReady]);

  // Upload PDF to backend
  async function uploadPDF(selectedFile) {
    try {
      setFile(selectedFile);
      setUploadingStatus("Uploading...");
      setPdfReady(false);
      
      setMessages(prev => [...prev, {
        type: 'system',
        content: `📄 Importing: ${selectedFile.name}`,
        timestamp: new Date()
      }]);

      // Create FormData and append the PDF file
      const formData = new FormData();
      formData.append("pdf", selectedFile);

      // Send POST request to upload endpoint
      await axios.post("http://localhost:4000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setUploadingStatus("Processing PDF...");

    } catch (error) {
      console.error("Upload error:", error);
      setUploadingStatus("");
      setPdfReady(false);
      setMessages(prev => [...prev, {
        type: 'system',
        content: `❌ Upload failed: ${error.message}`,
        timestamp: new Date()
      }]);
    }
  }

  // Query the PDF content
  async function queryPDF(query) {
    try {
      // Add user message to chat
      setMessages(prev => [...prev, {
        type: 'user',
        content: query,
        timestamp: new Date()
      }]);
      
      setLoading(true);
      setText("");

      // Send POST request to query endpoint
      const response = await axios.post("http://localhost:4000/query", {
        query: query
      });

      // Add AI response to chat
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: response.data.answer,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error("Query error:", error);
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: `Error: ${error.response?.data?.message || error.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  }

  function addDoc() {
    const el = document.createElement("input");
    el.type = "file";
    el.accept = "application/pdf";
    el.onchange = async (e) => {
      const selectedFile = e.target.files[0];
      if (!selectedFile) return;
      await uploadPDF(selectedFile);
    };
    el.click();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || !pdfReady || loading) return;
    await queryPDF(text);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      display: 'flex',
      flexDirection: 'column',
      color: '#fff'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderBottom: '1px solid #222',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: pdfReady ? '#00ff88' : '#ff4444',
            boxShadow: pdfReady ? '0 0 10px #00ff88' : '0 0 10px #ff4444',
            animation: 'pulse 2s ease-in-out infinite'
          }}></div>
          <h1 style={{
            fontSize: '18px',
            fontWeight: '700',
            margin: 0,
            letterSpacing: '0.5px',
            color: '#fff',
            textTransform: 'uppercase'
          }}>
            PDF NEURAL NET
          </h1>
        </div>
        
        <button
          onClick={addDoc}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #ff0080 0%, #7928ca 100%)',
            border: '1px solid #ff0080',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            boxShadow: '0 0 20px rgba(255, 0, 128, 0.3)',
            fontFamily: 'inherit'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 0, 128, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 0, 128, 0.3)';
          }}
        >
          <span style={{ marginRight: '8px' }}>⬆</span>
          Import PDF
        </button>
      </div>

      {/* File Status Bar */}
      {file && (
        <div style={{
          padding: '12px 24px',
          background: '#111',
          borderBottom: '1px solid #222',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#00ff88'
          }}>
            <span>▸</span>
            <span style={{ fontWeight: '600' }}>{file.name}</span>
            <span style={{ color: '#666' }}>|</span>
            <span style={{ color: '#888' }}>{(file.size / 1024).toFixed(1)} KB</span>
          </div>
          {uploadingStatus && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#ff0080'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                border: '2px solid #ff0080',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }}></div>
              <span>{uploadingStatus}</span>
            </div>
          )}
        </div>
      )}

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        background: '#0a0a0a',
        backgroundImage: `
          linear-gradient(rgba(255, 0, 128, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 0, 128, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          {messages.length === 0 && !file && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#666'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '20px',
                opacity: 0.3
              }}>⚡</div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                marginBottom: '12px',
                color: '#999',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}>
                Initialize Protocol
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#666',
                margin: 0
              }}>
                Import a PDF document to begin neural analysis
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '24px',
                animation: 'fadeIn 0.3s ease-in'
              }}
            >
              {msg.type === 'system' && (
                <div style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: 'rgba(0, 255, 136, 0.05)',
                  border: '1px solid rgba(0, 255, 136, 0.2)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#00ff88',
                  fontWeight: '500'
                }}>
                  {msg.content}
                </div>
              )}

              {msg.type === 'user' && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px'
                }}>
                  <div style={{
                    maxWidth: '70%',
                    padding: '16px 20px',
                    background: 'linear-gradient(135deg, #ff0080 0%, #7928ca 100%)',
                    borderRadius: '12px 12px 4px 12px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    boxShadow: '0 4px 12px rgba(255, 0, 128, 0.3)',
                    border: '1px solid rgba(255, 0, 128, 0.5)'
                  }}>
                    {msg.content}
                  </div>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    background: 'linear-gradient(135deg, #ff0080 0%, #7928ca 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    border: '1px solid rgba(255, 0, 128, 0.5)',
                    flexShrink: 0
                  }}>
                    👤
                  </div>
                </div>
              )}

              {msg.type === 'assistant' && (
                <div style={{
                  display: 'flex',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    background: 'linear-gradient(135deg, #00ff88 0%, #00ccff 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    border: '1px solid rgba(0, 255, 136, 0.5)',
                    boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
                    flexShrink: 0
                  }}>
                    🤖
                  </div>
                  <div style={{
                    maxWidth: '70%',
                    padding: '16px 20px',
                    background: '#1a1a1a',
                    borderRadius: '12px 12px 12px 4px',
                    fontSize: '14px',
                    lineHeight: '1.7',
                    border: '1px solid #333',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{
              display: 'flex',
              gap: '12px',
              animation: 'fadeIn 0.3s ease-in'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: 'linear-gradient(135deg, #00ff88 0%, #00ccff 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                border: '1px solid rgba(0, 255, 136, 0.5)',
                boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
                flexShrink: 0
              }}>
                🤖
              </div>
              <div style={{
                padding: '16px 20px',
                background: '#1a1a1a',
                borderRadius: '12px',
                border: '1px solid #333',
                display: 'flex',
                gap: '6px',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: '#00ff88',
                  borderRadius: '50%',
                  animation: 'bounce 1.4s infinite ease-in-out both',
                  animationDelay: '-0.32s'
                }}></div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: '#00ff88',
                  borderRadius: '50%',
                  animation: 'bounce 1.4s infinite ease-in-out both',
                  animationDelay: '-0.16s'
                }}></div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: '#00ff88',
                  borderRadius: '50%',
                  animation: 'bounce 1.4s infinite ease-in-out both'
                }}></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div style={{
        padding: '20px 24px',
        background: '#0f0f0f',
        borderTop: '1px solid #222',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end'
          }}>
            <div style={{ flex: 1 }}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={pdfReady ? "Enter your query..." : "Import a PDF to start"}
                disabled={!pdfReady}
                rows={1}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'none',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  color: '#fff',
                  cursor: pdfReady ? 'text' : 'not-allowed',
                  minHeight: '48px',
                  maxHeight: '120px'
                }}
                onFocus={(e) => {
                  if (pdfReady) {
                    e.currentTarget.style.borderColor = '#ff0080';
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 0, 128, 0.1)';
                  }
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#333';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>

            <button
              type="submit"
              disabled={!pdfReady || !text.trim() || loading}
              style={{
                padding: '14px 24px',
                background: (pdfReady && text.trim() && !loading) 
                  ? 'linear-gradient(135deg, #00ff88 0%, #00ccff 100%)'
                  : '#222',
                border: '1px solid ' + ((pdfReady && text.trim() && !loading) ? '#00ff88' : '#333'),
                borderRadius: '8px',
                color: (pdfReady && text.trim() && !loading) ? '#000' : '#666',
                fontSize: '14px',
                fontWeight: '700',
                cursor: (pdfReady && text.trim() && !loading) ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontFamily: 'inherit',
                minHeight: '48px',
                boxShadow: (pdfReady && text.trim() && !loading) ? '0 0 20px rgba(0, 255, 136, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (pdfReady && text.trim() && !loading) {
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 136, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = (pdfReady && text.trim() && !loading) ? '0 0 20px rgba(0, 255, 136, 0.3)' : 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Send ⚡
            </button>
          </form>

          {!pdfReady && (
            <p style={{
              fontSize: '12px',
              color: '#666',
              marginTop: '12px',
              textAlign: 'center',
              margin: '12px 0 0 0'
            }}>
              ⚠ Neural network offline - Import PDF to activate
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: scale(0);
          } 
          40% { 
            transform: scale(1);
          }
        }
        
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
    </div>
  );
}

export default Main;
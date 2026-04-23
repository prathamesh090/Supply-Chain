import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User, RefreshCw, Sparkles } from "lucide-react";

const API_BASE = "http://localhost:8000";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "Show my inventory levels",
  "Which suppliers are connected?",
  "What is safety stock formula?",
  "Show supplier risk scores",
  "Explain bullwhip effect",
  "How to reduce supply chain costs?",
];

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Hi! I'm ChainBot 🤖 — your supply chain assistant. Ask me anything about inventory, suppliers, routes, or demand forecasting!",
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const send = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", text: query, timestamp: new Date() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const params = new URLSearchParams({ query });
      const res = await fetch(`${API_BASE}/api/ads/chat-response?${params}`, { method: "POST" });
      const data = await res.json();
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: data.response || "I couldn't get a response. Please try again.",
        timestamp: new Date(),
      };
      setMessages((m) => [...m, botMsg]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: (Date.now() + 1).toString(), role: "bot", text: "Connection error. Make sure the backend is running.", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "bot",
        text: "Hi! I'm ChainBot 🤖 — your supply chain assistant. Ask me anything!",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        id="chatbot-toggle"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #7c3aed, #2563eb)",
          boxShadow: "0 0 30px rgba(124,58,237,0.5)",
        }}
        aria-label="Open ChainBot"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageSquare className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Pulse ring */}
        {!open && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }} />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="chatbot-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 right-6 z-50 w-[370px] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{
              height: "520px",
              background: "#0f0f1a",
              border: "1px solid rgba(124,58,237,0.3)",
              boxShadow: "0 0 60px rgba(124,58,237,0.2), 0 20px 60px rgba(0,0,0,0.6)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(37,99,235,0.2))" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">ChainBot</p>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-white/50 text-xs">DB + Knowledge + Groq AI</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Clear chat">
                  <RefreshCw className="w-3.5 h-3.5 text-white/50" />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                  <X className="w-3.5 h-3.5 text-white/50" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar */}
                  <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center
                    ${msg.role === "bot" ? "bg-purple-600" : "bg-blue-600"}`}>
                    {msg.role === "bot" ? <Bot className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-white" />}
                  </div>
                  {/* Bubble */}
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                    ${msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white/8 border border-white/10 text-white/90 rounded-bl-sm"}`}>
                    {msg.text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                      i % 2 === 1
                        ? <strong key={i} className="font-semibold text-white">{part}</strong>
                        : <span key={i}>{part}</span>
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white/8 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400"
                        animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions (only when few messages) */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 border-t border-white/5">
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Try asking
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)}
                      className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Ask about supply chain..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-all"
              />
              <button onClick={() => send()} disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

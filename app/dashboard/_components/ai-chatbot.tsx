"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X, Send, Sparkles, Bot, User, Trash2 } from "lucide-react";
import { askLocalAssistant } from "../actions-ai";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AiChatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your **Local Retail AI Assistant**. I can query real-time stock levels, catalog metrics, and sales revenue for your organization. How can I help you today?",
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close chatbot automatically whenever the user navigates to a new page
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close chatbot when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside, true);
      document.addEventListener("touchstart", handleClickOutside, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("touchstart", handleClickOutside, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSubmit = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: query }];
    setMessages(newMessages);
    if (!textToSend) setInput("");
    setIsLoading(true);

    try {
      const result = await askLocalAssistant(query, messages);
      setMessages([...newMessages, { role: "assistant", content: result }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, an unexpected error occurred while communicating with the database system.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat history cleared. What else can I calculate for you?",
      },
    ]);
  };

  const SUGGESTIONS = [
    { label: "Today's Revenue", text: "How is our sales revenue today?" },
    { label: "Low Stock Alert", text: "Show me low stock items" },
    { label: "Platform Resource Audit", text: "How many products and locations do we have?" },
  ];

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50 font-sans select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none relative group border border-indigo-400"
      >
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[420px] max-w-[calc(100vw-2rem)] h-[550px] bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md transition-all duration-300 transform scale-100 origin-bottom-right">
          {/* Header Panel */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-950 p-4 border-b border-slate-700 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Local AI Co-Pilot</h3>
                <span className="inline-flex items-center text-[10px] text-emerald-400 font-medium font-mono gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Mistral / Ollama Offline
                </span>
              </div>
            </div>
            <button
              onClick={clearChat}
              title="Clear chat logs"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-slate-900/50">
            {messages.map((msg, idx) => {
              const isAi = msg.role === "assistant";
              return (
                <div key={idx} className={`flex items-start gap-2.5 ${!isAi ? "flex-row-reverse" : ""}`}>
                  <div className={`p-1.5 rounded-md shrink-0 border ${
                    isAi ? "bg-indigo-900/20 border-indigo-500/20 text-indigo-400" : "bg-slate-800 border-slate-700 text-slate-300"
                  }`}>
                    {isAi ? <Bot className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                  </div>
                  <div className={`rounded-xl px-3.5 py-2.5 max-w-[80%] text-xs leading-relaxed shadow-sm border ${
                    isAi 
                      ? "bg-slate-800/80 border-slate-700/60 text-slate-200" 
                      : "bg-indigo-600 border-indigo-500 text-white font-medium"
                  }`}>
                    {isAi ? (
                      <div className="space-y-2 prose prose-invert select-text">
                        {msg.content.split("\n").map((line, lIdx) => {
                          let formattedLine = line;
                          const boldRegex = /\*\*(.*?)\*\*/g;
                          const italicRegex = /\*(.*?)\*/g;
                          
                          const isBullet = line.trim().startsWith("*") || line.trim().startsWith("-");
                          const isHeading3 = line.trim().startsWith("###");
                          const isHeading4 = line.trim().startsWith("####");
                          
                          let cleanText = line
                            .replace("### ", "")
                            .replace("#### ", "")
                            .replace(/^\*\s+/, "")
                            .replace(/^-\s+/, "");

                          const parts = [];
                          let lastIdx = 0;
                          let match;
                          const boldMatches = [...cleanText.matchAll(boldRegex)];
                          
                          return (
                            <p key={lIdx} className={`
                              ${isHeading3 ? "text-sm font-bold text-indigo-300 border-b border-slate-700/60 pb-1 mt-3 first:mt-0" : ""}
                              ${isHeading4 ? "text-xs font-semibold text-indigo-400 mt-2" : ""}
                              ${isBullet ? "pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-indigo-400" : ""}
                              ${line.trim().startsWith("*(Note:") ? "text-[10px] text-slate-500 italic mt-3" : ""}
                              ${line.trim().startsWith("---") ? "border-t border-slate-700/40 my-3" : ""}
                            `}>
                              {cleanText.split(boldRegex).map((part, pIdx) => {
                                if (pIdx % 2 === 1) {
                                  return <strong key={pIdx} className="text-white font-extrabold">{part}</strong>;
                                }
                                return part;
                              })}
                            </p>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="select-text whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-md border bg-indigo-900/20 border-indigo-500/20 text-indigo-400 animate-pulse">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-3 text-xs text-slate-400 flex items-center gap-1.5 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="ml-1 text-[10px] text-slate-500 font-mono">Running RAG execution...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-2 bg-slate-950/40 border-t border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0 whitespace-nowrap">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => handleSubmit(s.text)}
                disabled={isLoading}
                className="text-[10px] font-semibold bg-slate-800 border border-slate-700/70 hover:border-indigo-500/50 hover:bg-slate-850 hover:text-white text-slate-400 rounded-full px-3 py-1 cursor-pointer transition-all disabled:opacity-50"
              >
                {s.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2 items-center shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about inventory, sales, reorder alerts..."
              className="flex-1 h-9 rounded-lg bg-slate-850 border border-slate-700 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-9 w-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
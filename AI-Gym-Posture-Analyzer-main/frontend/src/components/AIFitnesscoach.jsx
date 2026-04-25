import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const suggestions = [
  "💪 Build muscle",
  "🔥 Burn fat fast",
  "🥗 Meal plan",
  "😴 Recovery tips",
  "🏃 Cardio routine",
];

function AIFitnessCoach() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text = input) => {
    if (!text.trim()) return;

    const userMessage = { sender: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) throw new Error("Server error");
      const data = await response.json();
      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error connecting to AI. Please try again." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
        :root {
          --bg: #0f0f0f; --surface: #1a1a1a; --surface2: #222;
          --accent: #e8c47a; --accent2: #f0a05a;
          --text: #f0ede8; --muted: #888;
          --border: #2e2e2e; --glow: rgba(232,196,122,0.15);
        }
        .fc-window { font-family: 'DM Sans', sans-serif; }
        .fc-header-title { font-family: 'Bebas Neue', sans-serif; }
        .fc-messages::-webkit-scrollbar { width: 4px; }
        .fc-messages::-webkit-scrollbar-track { background: transparent; }
        .fc-messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        @keyframes fcFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fcBounce {
          0%,60%,100% { transform: translateY(0); opacity: 0.4; }
          30%          { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes fcPop {
          from { transform: scale(0.7) translateY(30px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        .fc-msg-row { animation: fcFadeUp 0.3s ease; }
        .fc-window-enter { animation: fcPop 0.35s cubic-bezier(.34,1.56,.64,1); }
        .fc-dot { width:6px;height:6px;border-radius:50%;background:var(--muted);animation:fcBounce 1.2s infinite; }
        .fc-dot:nth-child(2){animation-delay:.2s}
        .fc-dot:nth-child(3){animation-delay:.4s}
      `}</style>

      <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12, zIndex: 1000 }}>

        {/* Chat Window */}
        {isOpen && (
          <div className="fc-window fc-window-enter" style={{
            width: 370, background: "var(--surface)", borderRadius: 20,
            border: "1px solid var(--border)", display: "flex", flexDirection: "column",
            overflow: "hidden", boxShadow: "0 0 60px rgba(0,0,0,.6), 0 0 30px var(--glow)",
            maxHeight: 580,
          }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg,#1c1812,#2a2010)", padding: "18px 20px 14px", borderBottom: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, background: "radial-gradient(circle,rgba(232,196,122,.2) 0%,transparent 70%)", borderRadius: "50%" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,var(--accent),var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, position: "relative", flexShrink: 0 }}>
                  🏋️
                  <span style={{ position: "absolute", bottom: -2, right: -2, width: 10, height: 10, background: "#4ade80", borderRadius: "50%", border: "2px solid var(--surface)" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="fc-header-title" style={{ fontSize: 20, letterSpacing: 1.5, color: "var(--accent)", lineHeight: 1 }}>AI Fitness Coach</div>
                  <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 500, marginTop: 2, letterSpacing: .5 }}>● Online · Ready to train</div>
                </div>
                <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 18, lineHeight: 1, padding: 4, borderRadius: 6 }}>✕</button>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 8, letterSpacing: .3 }}>Your personal AI coach — workouts, nutrition & recovery.</div>
            </div>

            {/* Suggestion Chips */}
            <div style={{ display: "flex", gap: 6, padding: "10px 16px", overflowX: "auto", background: "var(--bg)", borderBottom: "1px solid var(--border)", scrollbarWidth: "none" }}>
              {suggestions.map((s) => (
                <button key={s} onClick={() => sendMessage(s.replace(/^[^\w]+/, "").trim())}
                  style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--accent)", fontSize: 11, fontWeight: 500, padding: "5px 11px", borderRadius: 20, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "DM Sans, sans-serif" }}>
                  {s}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="fc-messages" style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12, minHeight: 300, maxHeight: 340 }}>
              {messages.length === 0 && !isTyping ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, color: "var(--muted)", textAlign: "center", padding: 20 }}>
                  <div style={{ fontSize: 38, opacity: .5 }}>🏆</div>
                  <p style={{ fontSize: 13, lineHeight: 1.6 }}>Hey, champ! Ask me anything about <strong style={{ color: "var(--accent)" }}>workouts, nutrition,</strong> or <strong style={{ color: "var(--accent)" }}>recovery</strong>.</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <div key={i} className="fc-msg-row" style={{ display: "flex", flexDirection: "column", alignItems: msg.sender === "user" ? "flex-end" : "flex-start" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: .5, marginBottom: 4, textTransform: "uppercase", color: msg.sender === "user" ? "var(--accent)" : "var(--muted)" }}>
                        {msg.sender === "user" ? "You" : "Coach AI"}
                      </div>
                      <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: 16, fontSize: 13.5, lineHeight: 1.6, color: "var(--text)", ...(msg.sender === "user" ? { background: "linear-gradient(135deg,#2f2210,#3a2c10)", borderBottomRightRadius: 4, border: "1px solid rgba(232,196,122,.2)" } : { background: "var(--bg)", borderBottomLeftRadius: 4, border: "1px solid var(--border)" }) }}>
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="fc-msg-row" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: .5, marginBottom: 4, textTransform: "uppercase", color: "var(--muted)" }}>Coach AI</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "12px 16px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, borderBottomLeftRadius: 4 }}>
                        <span className="fc-dot" /><span className="fc-dot" /><span className="fc-dot" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div style={{ padding: "12px 14px", background: "var(--bg)", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask about fitness..."
                style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "DM Sans, sans-serif", fontSize: 13.5, padding: "10px 14px", borderRadius: 12, outline: "none" }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={isTyping}
                style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,var(--accent),var(--accent2))", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, opacity: isTyping ? .4 : 1 }}>
                ➤
              </button>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <button onClick={() => setIsOpen((o) => !o)}
          style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg,var(--accent),var(--accent2))", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 0 24px var(--glow), 0 8px 32px rgba(0,0,0,.5)" }}>
          🏋️
        </button>
      </div>
    </>
  );
}

export default AIFitnessCoach;
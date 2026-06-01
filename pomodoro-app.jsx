import { useState, useEffect, useRef, useCallback } from "react";

// ─── Motivational Quotes ───────────────────────────────────────────────────────
const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "You don't have to see the whole staircase, just take the first step.", author: "MLK Jr." },
  { text: "Concentrate all your thoughts upon the work at hand.", author: "Alexander Graham Bell" },
  { text: "The art of being wise is knowing what to overlook.", author: "William James" },
  { text: "It's not that I'm so smart, it's just that I stay with problems longer.", author: "Einstein" },
];

const TESTIMONIALS = [
  { name: "Aria Chen", role: "Software Engineer @ Stripe", avatar: "AC", text: "FlowFocus completely transformed my coding sessions. I went from scattered 2-hour blocks to crisp, deep work sprints. My output doubled in a month.", stars: 5 },
  { name: "Marcus Webb", role: "PhD Student, MIT", avatar: "MW", text: "Writing my dissertation felt impossible until I started using FlowFocus. The streak system kept me accountable when motivation was low.", stars: 5 },
  { name: "Sofia Reyes", role: "Freelance Designer", avatar: "SR", text: "As a remote worker, maintaining focus is the hardest part of my job. FlowFocus's ambient sounds and session tracking made it feel effortless.", stars: 5 },
  { name: "James Park", role: "Product Manager @ Linear", avatar: "JP", text: "We rolled this out to our entire team. The shared stats dashboard created friendly competition and our weekly velocity jumped 40%.", stars: 5 },
];

const PRICING = [
  {
    name: "Free", price: "$0", period: "forever",
    features: ["25 Pomodoro sessions/day", "Basic task management", "Session statistics", "3 ambient sounds", "Mobile app access"],
    cta: "Get Started Free", highlight: false,
  },
  {
    name: "Pro", price: "$9", period: "/month",
    features: ["Unlimited sessions", "Advanced analytics & charts", "Unlimited tasks & projects", "30+ ambient sounds", "Team collaboration", "Cloud sync across devices", "Priority support", "Custom timer durations"],
    cta: "Start 14-Day Trial", highlight: true,
  },
  {
    name: "Team", price: "$24", period: "/month",
    features: ["Everything in Pro", "Up to 20 members", "Team dashboard", "Shared projects", "Admin controls", "SSO & SAML", "Dedicated success manager", "Custom integrations"],
    cta: "Contact Sales", highlight: false,
  },
];

// ─── Sound Generator (Web Audio API) ──────────────────────────────────────────
function playBeep(ctx) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880;
  osc.type = "sine";
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.8);
}

// ─── Circular Progress ─────────────────────────────────────────────────────────
function CircularProgress({ progress, timeLeft, mode, isRunning }) {
  const radius = 110;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (progress / 100) * circ;
  const modeColors = { focus: "#6366F1", short: "#06B6D4", long: "#8B5CF6" };
  const color = modeColors[mode];

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  return (
    <div style={{ position: "relative", width: 260, height: 260, margin: "0 auto" }}>
      <svg width="260" height="260" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="130" cy="130" r={radius} fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth="10" />
        <circle
          cx="130" cy="130" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.4s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
      }}>
        <span style={{
          fontSize: 52, fontWeight: 700, letterSpacing: "-2px",
          fontFamily: "'DM Mono', monospace",
          color: "var(--text-primary)", lineHeight: 1
        }}>{mm}:{ss}</span>
        <span style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6, letterSpacing: 2, textTransform: "uppercase" }}>
          {mode === "focus" ? "Focus Time" : mode === "short" ? "Short Break" : "Long Break"}
        </span>
        {isRunning && (
          <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: "50%", background: color,
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
              }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Weekly Chart ──────────────────────────────────────────────────────────────
function WeeklyChart({ data, dark }) {
  const max = Math.max(...data.map(d => d.sessions), 1);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100, padding: "0 4px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{d.sessions}</span>
          <div style={{
            width: "100%", borderRadius: 6,
            height: `${Math.max((d.sessions / max) * 70, 4)}px`,
            background: i === new Date().getDay() - 1
              ? "linear-gradient(180deg, #6366F1, #8B5CF6)"
              : dark ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.15)",
            transition: "height 0.6s ease"
          }} />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Task Item ─────────────────────────────────────────────────────────────────
function TaskItem({ task, onToggle, onDelete, onEdit, dragHandlers }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(task.text);
  return (
    <div
      {...dragHandlers}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 14px",
        borderRadius: 12,
        background: "var(--card-bg)",
        border: "1.5px solid var(--border)",
        cursor: "grab",
        opacity: task.done ? 0.55 : 1,
        transition: "all 0.2s ease",
      }}
    >
      <button onClick={() => onToggle(task.id)} style={{
        width: 22, height: 22, borderRadius: 6, border: "2px solid",
        borderColor: task.done ? "#6366F1" : "var(--border-strong)",
        background: task.done ? "#6366F1" : "transparent",
        cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        {task.done && <svg width="12" height="12" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </button>
      {editing ? (
        <input value={val} onChange={e => setVal(e.target.value)}
          onBlur={() => { onEdit(task.id, val); setEditing(false); }}
          onKeyDown={e => { if (e.key === "Enter") { onEdit(task.id, val); setEditing(false); } }}
          autoFocus
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            fontSize: 14, color: "var(--text-primary)", fontFamily: "inherit"
          }} />
      ) : (
        <span onDoubleClick={() => setEditing(true)} style={{
          flex: 1, fontSize: 14, color: "var(--text-primary)",
          textDecoration: task.done ? "line-through" : "none",
          cursor: "text"
        }}>{task.text}</span>
      )}
      <span style={{
        fontSize: 11, padding: "2px 8px", borderRadius: 20,
        background: "rgba(99,102,241,0.12)", color: "#6366F1", fontWeight: 600
      }}>🍅 {task.pomodoros}</span>
      <button onClick={() => onDelete(task.id)} style={{
        background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
        fontSize: 16, lineHeight: 1, padding: 2
      }}>×</button>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(true);
  const [mode, setMode] = useState("focus"); // focus | short | long
  const DURATIONS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
  const [timeLeft, setTimeLeft] = useState(DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsToday, setSessionsToday] = useState(3);
  const [focusMinutes, setFocusMinutes] = useState(75);
  const [streak, setStreak] = useState(7);
  const [tasks, setTasks] = useState([
    { id: 1, text: "Review pull request #247", done: false, pomodoros: 2 },
    { id: 2, text: "Write unit tests for auth module", done: true, pomodoros: 3 },
    { id: 3, text: "Update API documentation", done: false, pomodoros: 1 },
    { id: 4, text: "Refactor database queries", done: false, pomodoros: 4 },
  ]);
  const [newTask, setNewTask] = useState("");
  const [activeSection, setActiveSection] = useState("timer");
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [weekData] = useState([
    { sessions: 4 }, { sessions: 6 }, { sessions: 3 }, { sessions: 8 },
    { sessions: 5 }, { sessions: 2 }, { sessions: sessionsToday }
  ]);

  const audioCtx = useRef(null);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);

  const getAudioCtx = () => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx.current;
  };

  const totalDur = DURATIONS[mode];
  const progress = ((totalDur - timeLeft) / totalDur) * 100;

  const handleModeChange = (m) => {
    setMode(m); setTimeLeft(DURATIONS[m]); setIsRunning(false);
    clearInterval(intervalRef.current);
  };

  const handleStartPause = () => {
    getAudioCtx();
    setIsRunning(r => !r);
  };

  const handleReset = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setTimeLeft(DURATIONS[mode]);
  };

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            playBeep(audioCtx.current);
            if (mode === "focus") {
              setSessionsToday(s => s + 1);
              setFocusMinutes(m => m + 25);
            }
            return DURATIONS[mode];
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode]);

  useEffect(() => {
    const id = setInterval(() => setQuoteIdx(i => (i + 1) % QUOTES.length), 8000);
    return () => clearInterval(id);
  }, []);

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks(ts => [...ts, { id: Date.now(), text: newTask.trim(), done: false, pomodoros: 1 }]);
    setNewTask("");
  };

  const toggleTask = (id) => setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask = (id) => setTasks(ts => ts.filter(t => t.id !== id));
  const editTask = (id, text) => setTasks(ts => ts.map(t => t.id === id ? { ...t, text } : t));

  // ── Styles ──────────────────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: ${dark ? "#0A0A0F" : "#F8F8FC"};
      --bg2: ${dark ? "#12121A" : "#FFFFFF"};
      --bg3: ${dark ? "#1A1A26" : "#F0F0F8"};
      --text-primary: ${dark ? "#F0F0FF" : "#0D0D1A"};
      --text-secondary: ${dark ? "#A0A0C0" : "#444460"};
      --text-muted: ${dark ? "#606080" : "#8888AA"};
      --border: ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"};
      --border-strong: ${dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"};
      --card-bg: ${dark ? "#1A1A26" : "#FFFFFF"};
      --card-hover: ${dark ? "#1E1E2E" : "#F4F4FC"};
      --glow: ${dark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)"};
    }

    body { background: var(--bg); color: var(--text-primary); font-family: 'Sora', sans-serif; }

    @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }
    @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes slideIn { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
    @keyframes quoteIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

    .fade-in { animation: fadeIn 0.6s ease both; }
    .hero-text { animation: fadeIn 0.8s ease both; }

    .nav-link {
      color: var(--text-secondary); font-size: 14px; font-weight: 500;
      cursor: pointer; padding: 6px 12px; border-radius: 8px;
      transition: all 0.2s; text-decoration: none; border: none; background: none;
    }
    .nav-link:hover { color: var(--text-primary); background: var(--bg3); }

    .btn-primary {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white; border: none; border-radius: 12px;
      padding: 13px 28px; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: all 0.2s; font-family: 'Sora', sans-serif;
      box-shadow: 0 4px 20px rgba(99,102,241,0.35);
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(99,102,241,0.5); }
    .btn-primary:active { transform: translateY(0); }

    .btn-secondary {
      background: var(--bg3); color: var(--text-primary);
      border: 1.5px solid var(--border-strong); border-radius: 12px;
      padding: 12px 24px; font-size: 14px; font-weight: 500;
      cursor: pointer; transition: all 0.2s; font-family: 'Sora', sans-serif;
    }
    .btn-secondary:hover { background: var(--card-hover); border-color: #6366F1; }

    .card {
      background: var(--card-bg); border: 1.5px solid var(--border);
      border-radius: 20px; padding: 24px;
      transition: all 0.3s ease;
    }
    .card:hover { border-color: rgba(99,102,241,0.3); box-shadow: 0 8px 40px var(--glow); }

    .mode-btn {
      padding: 8px 18px; border-radius: 10px; border: none;
      font-size: 13px; font-weight: 600; cursor: pointer;
      font-family: 'Sora', sans-serif; transition: all 0.2s;
    }

    .timer-action {
      width: 56px; height: 56px; border-radius: 16px; border: 1.5px solid var(--border-strong);
      background: var(--bg3); color: var(--text-primary);
      font-size: 20px; cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; justify-content: center;
    }
    .timer-action:hover { background: var(--card-hover); border-color: #6366F1; }

    .stat-card {
      background: var(--card-bg); border: 1.5px solid var(--border);
      border-radius: 16px; padding: 20px; text-align: center;
      transition: all 0.3s;
    }
    .stat-card:hover { border-color: rgba(99,102,241,0.4); transform: translateY(-2px); }

    .section-tab {
      padding: 9px 20px; border-radius: 10px; border: none;
      font-size: 14px; font-weight: 600; cursor: pointer;
      font-family: 'Sora', sans-serif; transition: all 0.2s;
    }

    .feature-card {
      background: var(--card-bg); border: 1.5px solid var(--border);
      border-radius: 20px; padding: 28px; transition: all 0.3s;
    }
    .feature-card:hover { border-color: rgba(99,102,241,0.4); transform: translateY(-4px); box-shadow: 0 16px 48px var(--glow); }

    .pricing-card {
      background: var(--card-bg); border: 1.5px solid var(--border);
      border-radius: 24px; padding: 32px; transition: all 0.3s;
    }
    .pricing-card.featured {
      border-color: #6366F1; box-shadow: 0 0 0 1px #6366F1, 0 20px 60px rgba(99,102,241,0.25);
    }

    .testimonial-card {
      background: var(--card-bg); border: 1.5px solid var(--border);
      border-radius: 20px; padding: 24px; transition: all 0.3s;
    }
    .testimonial-card:hover { border-color: rgba(99,102,241,0.3); }

    .gradient-text {
      background: linear-gradient(135deg, #6366F1, #8B5CF6, #06B6D4);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .quote-text { animation: quoteIn 0.5s ease both; }

    .task-input {
      background: var(--bg3); border: 1.5px solid var(--border);
      border-radius: 12px; padding: 12px 16px;
      color: var(--text-primary); font-family: 'Sora', sans-serif;
      font-size: 14px; outline: none; transition: border-color 0.2s;
    }
    .task-input:focus { border-color: #6366F1; }
    .task-input::placeholder { color: var(--text-muted); }

    .hero-gradient {
      background: radial-gradient(ellipse 80% 60% at 50% -10%, ${dark ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.12)"} 0%, transparent 70%);
    }

    .grid-dot {
      background-image: radial-gradient(circle, ${dark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)"} 1px, transparent 1px);
      background-size: 32px 32px;
    }

    .focus-ring { box-shadow: 0 0 0 3px rgba(99,102,241,0.4); }

    @media (max-width: 768px) {
      .hide-mobile { display: none !important; }
      .stack-mobile { flex-direction: column !important; }
      .full-mobile { width: 100% !important; }
    }
  `;

  const modeColors = {
    focus: { bg: "rgba(99,102,241,0.15)", color: "#6366F1" },
    short: { bg: "rgba(6,182,212,0.15)", color: "#06B6D4" },
    long: { bg: "rgba(139,92,246,0.15)", color: "#8B5CF6" },
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-primary)" }}>
      <style>{css}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: dark ? "rgba(10,10,15,0.85)" : "rgba(248,248,252,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 32px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", height: 64, gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: "auto" }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, boxShadow: "0 4px 12px rgba(99,102,241,0.4)"
            }}>🍅</div>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.5px" }}>FlowFocus</span>
          </div>
          <div className="hide-mobile" style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {["Features", "How It Works", "Pricing", "Blog"].map(l => (
              <button key={l} className="nav-link">{l}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginLeft: 16, alignItems: "center" }}>
            <button onClick={() => setDark(d => !d)} style={{
              background: "var(--bg3)", border: "1.5px solid var(--border)",
              borderRadius: 10, width: 36, height: 36, cursor: "pointer",
              fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center"
            }}>{dark ? "☀️" : "🌙"}</button>
            <button className="btn-primary" style={{ padding: "8px 18px", fontSize: 13 }}>Sign Up Free</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-gradient grid-dot" style={{ padding: "100px 32px 80px", textAlign: "center" }}>
        <div className="fade-in" style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: dark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: 40, padding: "6px 16px", marginBottom: 28,
            fontSize: 13, fontWeight: 600, color: "#8B8CF6"
          }}>
            ✨ Trusted by 50,000+ focused professionals
          </div>

          <h1 style={{
            fontSize: "clamp(36px, 6vw, 68px)", fontWeight: 800, lineHeight: 1.08,
            letterSpacing: "-2px", marginBottom: 24,
          }}>
            Focus Better with the{" "}
            <span className="gradient-text">Pomodoro</span>{" "}
            Technique
          </h1>

          <p style={{
            fontSize: 19, color: "var(--text-secondary)", maxWidth: 560,
            margin: "0 auto 40px", lineHeight: 1.7, fontWeight: 400
          }}>
            Beat procrastination, eliminate distractions, and achieve more in less time — with a scientifically proven focus system trusted by the world's most productive people.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" style={{ fontSize: 15 }}
              onClick={() => document.getElementById("app-section").scrollIntoView({ behavior: "smooth" })}>
              🚀 Start Focus Session
            </button>
            <button className="btn-secondary"
              onClick={() => document.getElementById("learn-section").scrollIntoView({ behavior: "smooth" })}>
              Learn More ↓
            </button>
          </div>

          <div style={{ display: "flex", gap: 32, justifyContent: "center", marginTop: 56, flexWrap: "wrap" }}>
            {[["50K+", "Active Users"], ["2M+", "Sessions Completed"], ["4.9★", "App Store Rating"]].map(([n, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#6366F1", letterSpacing: "-1px" }}>{n}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOTIVATIONAL QUOTE ── */}
      <div style={{
        background: dark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.06)",
        borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
        padding: "20px 32px", textAlign: "center"
      }}>
        <p key={quoteIdx} className="quote-text" style={{ fontSize: 15, color: "var(--text-secondary)", fontStyle: "italic" }}>
          "{QUOTES[quoteIdx].text}" — <strong style={{ color: "var(--text-primary)" }}>{QUOTES[quoteIdx].author}</strong>
        </p>
      </div>

      {/* ── MAIN APP ── */}
      <section id="app-section" style={{ padding: "64px 32px", maxWidth: 1200, margin: "0 auto" }}>

        {/* Section Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 40, background: "var(--bg3)", padding: 6, borderRadius: 14, width: "fit-content" }}>
          {[["timer", "⏱ Timer"], ["stats", "📊 Stats"], ["tasks", "✅ Tasks"]].map(([key, label]) => (
            <button key={key} className="section-tab"
              onClick={() => setActiveSection(key)}
              style={{
                background: activeSection === key ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "transparent",
                color: activeSection === key ? "white" : "var(--text-muted)",
                boxShadow: activeSection === key ? "0 4px 12px rgba(99,102,241,0.4)" : "none",
              }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

          {/* ─ LEFT: Timer ─ */}
          <div style={{ gridColumn: "1", display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card" style={{ textAlign: "center" }}>
              {/* Mode Buttons */}
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 32 }}>
                {[["focus", "🎯 Focus"], ["short", "☕ Short Break"], ["long", "🌿 Long Break"]].map(([m, label]) => (
                  <button key={m} className="mode-btn" onClick={() => handleModeChange(m)}
                    style={{
                      background: mode === m ? modeColors[m].bg : "var(--bg3)",
                      color: mode === m ? modeColors[m].color : "var(--text-muted)",
                      border: `1.5px solid ${mode === m ? modeColors[m].color : "var(--border)"}`,
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              <CircularProgress progress={progress} timeLeft={timeLeft} mode={mode} isRunning={isRunning} />

              {/* Controls */}
              <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center", marginTop: 32 }}>
                <button className="timer-action" onClick={handleReset} title="Reset">↺</button>
                <button onClick={handleStartPause} style={{
                  width: 72, height: 72, borderRadius: 20,
                  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  border: "none", color: "white", fontSize: 26, cursor: "pointer",
                  boxShadow: "0 8px 30px rgba(99,102,241,0.5)",
                  transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {isRunning ? "⏸" : "▶"}
                </button>
                <button className="timer-action" onClick={() => setMode(m => m === "focus" ? "short" : "focus")} title="Skip">⏭</button>
              </div>

              {/* Session dots */}
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 24 }}>
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: i < sessionsToday % 8 ? "#6366F1" : "var(--border-strong)",
                    transition: "background 0.3s"
                  }} />
                ))}
              </div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
                {sessionsToday % 4}/4 sessions until long break
              </p>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="card" style={{ padding: 16 }}>
              <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", fontFamily: "'DM Mono', monospace" }}>
                Press <kbd style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 5, padding: "2px 6px", fontSize: 11 }}>Space</kbd> to start/pause &nbsp;·&nbsp;
                <kbd style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 5, padding: "2px 6px", fontSize: 11 }}>R</kbd> to reset
              </p>
            </div>
          </div>

          {/* ─ RIGHT: Dynamic Panel ─ */}
          <div style={{ gridColumn: "2", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Stats Panel */}
            {(activeSection === "stats" || activeSection === "timer") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    ["🍅", sessionsToday, "Sessions Today", "#6366F1"],
                    ["⏱", `${focusMinutes}m`, "Focus Time", "#8B5CF6"],
                    ["🔥", streak, "Day Streak", "#F59E0B"],
                    ["✅", tasks.filter(t => t.done).length, "Tasks Done", "#10B981"],
                  ].map(([icon, val, label, color]) => (
                    <div className="stat-card" key={label}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: "-1px" }}>{val}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 16 }}>Weekly Sessions</p>
                  <WeeklyChart data={weekData} dark={dark} />
                </div>
              </div>
            )}

            {/* Tasks Panel */}
            {(activeSection === "tasks" || activeSection === "timer") && (
              <div className="card" style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>Tasks</h3>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {tasks.filter(t => t.done).length}/{tasks.length} done
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <input
                    className="task-input" style={{ flex: 1 }}
                    placeholder="Add a task..."
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addTask()}
                  />
                  <button className="btn-primary" onClick={addTask} style={{ padding: "12px 18px", borderRadius: 12, fontSize: 18 }}>+</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
                  {tasks.map(task => (
                    <TaskItem key={task.id} task={task}
                      onToggle={toggleTask} onDelete={deleteTask} onEdit={editTask}
                      dragHandlers={{}} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── LEARN SECTION ── */}
      <section id="learn-section" style={{
        padding: "80px 32px",
        background: dark ? "rgba(99,102,241,0.05)" : "rgba(99,102,241,0.03)",
        borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)"
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-1.5px", marginBottom: 16 }}>
              What is the <span className="gradient-text">Pomodoro Technique?</span>
            </h2>
            <p style={{ fontSize: 17, color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto" }}>
              Developed by Francesco Cirillo in the late 1980s, the Pomodoro Technique is a time management method that uses focused work intervals to maximize your mental performance.
            </p>
          </div>

          {/* Steps */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 64 }}>
            {[
              { num: "01", icon: "📋", title: "Choose a Task", desc: "Pick one task you want to work on. Break it down if needed." },
              { num: "02", icon: "⏱", title: "Set 25 Minutes", desc: "Start the timer for a focused 25-minute work session." },
              { num: "03", icon: "🎯", title: "Work Deeply", desc: "Eliminate distractions and focus entirely on your chosen task." },
              { num: "04", icon: "✅", title: "Mark Progress", desc: "When the timer rings, mark one Pomodoro complete." },
              { num: "05", icon: "☕", title: "Take a Break", desc: "Rest for 5 minutes. Stretch, breathe, or get water." },
              { num: "06", icon: "🔁", title: "Repeat & Grow", desc: "After 4 Pomodoros, take a 15-minute long break." },
            ].map(s => (
              <div className="feature-card" key={s.num}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6366F1", letterSpacing: 3, marginBottom: 12 }}>{s.num}</div>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <h3 style={{ fontSize: 28, fontWeight: 800, textAlign: "center", marginBottom: 32, letterSpacing: "-1px" }}>
            Why it <span className="gradient-text">works</span>
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {[
              ["🧠", "Reduces Mental Fatigue", "Regular breaks prevent cognitive overload and keep your mind fresh throughout the day."],
              ["⚡", "Creates Urgency", "Time-boxing turns vague tasks into sprints with a clear end, reducing procrastination."],
              ["📈", "Builds Momentum", "Completing sessions releases dopamine, motivating you to keep pushing forward."],
              ["🎯", "Improves Estimates", "Tracking Pomodoros per task makes you better at planning future work accurately."],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{
                display: "flex", gap: 14, padding: "20px",
                background: "var(--card-bg)", border: "1.5px solid var(--border)", borderRadius: 16
              }}>
                <div style={{ fontSize: 24, flexShrink: 0 }}>{icon}</div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{title}</h4>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "80px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-1.5px", marginBottom: 12 }}>
              Loved by <span className="gradient-text">focused people</span>
            </h2>
            <p style={{ fontSize: 16, color: "var(--text-secondary)" }}>Join 50,000+ professionals who transformed their productivity</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {TESTIMONIALS.map(t => (
              <div className="testimonial-card" key={t.name}>
                <div style={{ color: "#F59E0B", fontSize: 15, marginBottom: 12 }}>{"★".repeat(t.stars)}</div>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>"{t.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: "white"
                  }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{
        padding: "80px 32px",
        background: dark ? "rgba(99,102,241,0.05)" : "rgba(99,102,241,0.03)",
        borderTop: "1px solid var(--border)"
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-1.5px", marginBottom: 12 }}>
              Simple, transparent <span className="gradient-text">pricing</span>
            </h2>
            <p style={{ fontSize: 16, color: "var(--text-secondary)" }}>Start free. Upgrade when you're ready to unlock your full potential.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, alignItems: "start" }}>
            {PRICING.map(plan => (
              <div className={`pricing-card${plan.highlight ? " featured" : ""}`} key={plan.name}
                style={{ position: "relative" }}>
                {plan.highlight && (
                  <div style={{
                    position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                    color: "white", fontSize: 12, fontWeight: 700, padding: "4px 18px",
                    borderRadius: 40, whiteSpace: "nowrap", letterSpacing: 0.5
                  }}>⭐ Most Popular</div>
                )}
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{plan.name}</h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                  <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-2px", color: plan.highlight ? "#6366F1" : "var(--text-primary)" }}>{plan.price}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: 14 }}>{plan.period}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "var(--text-secondary)" }}>
                      <span style={{ color: plan.highlight ? "#6366F1" : "#10B981", flexShrink: 0 }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>
                <button style={{
                  width: "100%", padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                  cursor: "pointer", fontFamily: "Sora, sans-serif", transition: "all 0.2s",
                  background: plan.highlight ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "var(--bg3)",
                  color: plan.highlight ? "white" : "var(--text-primary)",
                  border: plan.highlight ? "none" : "1.5px solid var(--border-strong)",
                  boxShadow: plan.highlight ? "0 8px 24px rgba(99,102,241,0.4)" : "none"
                }}>{plan.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: "48px 32px 32px",
        borderTop: "1px solid var(--border)",
        background: dark ? "rgba(10,10,15,0.9)" : "rgba(248,248,252,0.9)"
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🍅</div>
                <span style={{ fontWeight: 800, fontSize: 16 }}>FlowFocus</span>
              </div>
              <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 280 }}>
                The most beautiful Pomodoro timer for students, developers, and remote workers who take their focus seriously.
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                {["𝕏", "in", "📦", "📸"].map((icon, i) => (
                  <div key={i} style={{
                    width: 34, height: 34, borderRadius: 8, border: "1.5px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, cursor: "pointer", background: "var(--bg3)", transition: "all 0.2s"
                  }}>{icon}</div>
                ))}
              </div>
            </div>
            {[
              ["Product", ["Features", "Timer", "Statistics", "Tasks", "PWA App"]],
              ["Company", ["About", "Blog", "Careers", "Press", "Contact"]],
              ["Legal", ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR"]]
            ].map(([title, links]) => (
              <div key={title}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, letterSpacing: 0.5, textTransform: "uppercase" }}>{title}</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {links.map(l => (
                    <a key={l} href="#" style={{ fontSize: 14, color: "var(--text-muted)", textDecoration: "none", transition: "color 0.2s" }}
                      onMouseOver={e => e.target.style.color = "#6366F1"}
                      onMouseOut={e => e.target.style.color = "var(--text-muted)"}>{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>© 2026 FlowFocus. All rights reserved. Built with ❤️ for focused people.</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>🍅 Do deep work. Ship great things.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

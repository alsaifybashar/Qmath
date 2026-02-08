import { useState, useEffect, useRef, useCallback } from "react";
import {
    Flame, Zap, BookOpen, Target, ChevronRight, Play, Brain,
    Clock, TrendingUp, Award, Calendar, ArrowRight, Sparkles,
    BarChart3, GraduationCap, Star, CheckCircle2, Circle,
    AlertCircle, RefreshCw, FileText, Plus, Search,
    Bell, Home, LayoutGrid, LineChart, Library, Settings,
    ChevronDown, Trophy, Bookmark, ArrowUpRight, Minus
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   DESIGN SYSTEM — "Academic Constellation"
   Blends: Landing page polish + Dashboard warmth
   ═══════════════════════════════════════════════════════════════ */

const C = {
    bg: "#F0F2F8",
    surface: "#FFFFFF",
    surfaceAlt: "#F7F8FC",
    text: "#1A1D2E",
    textSec: "#6B7194",
    textMuted: "#A0A5C0",
    blue: "#4361EE",
    blueLight: "#EEF1FF",
    blueDark: "#2D3FBF",
    purple: "#7C5CFC",
    orange: "#FF8C42",
    orangeWarm: "#FF6B35",
    green: "#22C55E",
    greenLight: "#ECFDF5",
    red: "#EF4444",
    redLight: "#FEF2F2",
    yellow: "#FBBF24",
    yellowLight: "#FEF9C3",
    border: "#E4E7F1",
    borderLight: "#EFF1F8",
    cardShadow: "0 2px 12px rgba(26,29,46,0.06)",
    cardHover: "0 8px 32px rgba(26,29,46,0.1)",
};

// ── MOCK DATA ──────────────────────────────────────────────
const USER = {
    name: "Bashar",
    avatar: "B",
    level: 7,
    xp: 3240,
    xpToNext: 4000,
    streak: 12,
    bestStreak: 23,
    rank: "Dedikerad Student",
    totalQuestions: 847,
    accuracy: 78,
    studyHours: 42,
};

const COURSES = [
    {
        id: 1, code: "TATA41", name: "Envariabelanalys", subtitle: "Calculus",
        progress: 72, mastery: 0.68, reviews: 3,
        gradient: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
        bgPattern: "calculus",
        topicsMastered: 9, topicsTotal: 14,
        examDate: "14 Mar", daysLeft: 34, readiness: 68,
    },
    {
        id: 2, code: "TATA24", name: "Linjär Algebra", subtitle: "Linear algebra",
        progress: 45, mastery: 0.41, reviews: 4,
        gradient: "linear-gradient(135deg, #F6D365 0%, #FDA085 100%)",
        bgPattern: "linalg",
        topicsMastered: 5, topicsTotal: 12,
        examDate: "17 Mar", daysLeft: 37, readiness: 42,
    },
    {
        id: 3, code: "TAMS42", name: "Sannolikhetsteori", subtitle: "Probability & statistics",
        progress: 28, mastery: 0.22, reviews: 12,
        gradient: "linear-gradient(135deg, #11998E 0%, #38EF7D 100%)",
        bgPattern: "stats",
        topicsMastered: 2, topicsTotal: 10,
        examDate: "20 Mar", daysLeft: 40, readiness: 24,
    },
];

const MASTERY_TOPICS = [
    { id: 1, name: "Gränsvärden", m: 0.96, course: "TATA41" },
    { id: 2, name: "Derivata", m: 0.93, course: "TATA41" },
    { id: 13, name: "Kedjeregeln", m: 0.95, course: "TATA41" },
    { id: 15, name: "Extremvärden", m: 0.83, course: "TATA41" },
    { id: 3, name: "Integraler", m: 0.78, course: "TATA41" },
    { id: 4, name: "Taylorserier", m: 0.55, course: "TATA41" },
    { id: 5, name: "Diff.ekvationer", m: 0.34, course: "TATA41" },
    { id: 6, name: "Vektorrum", m: 0.88, course: "TATA24" },
    { id: 14, name: "Ortogonalitet", m: 0.72, course: "TATA24" },
    { id: 7, name: "Egenvärden", m: 0.62, course: "TATA24" },
    { id: 8, name: "Linjära avbildn.", m: 0.41, course: "TATA24" },
    { id: 9, name: "Determinanter", m: 0.29, course: "TATA24" },
    { id: 10, name: "Sannolikhetsrum", m: 0.45, course: "TAMS42" },
    { id: 11, name: "Stokast. variabler", m: 0.18, course: "TAMS42" },
    { id: 12, name: "Normalfördelning", m: 0.12, course: "TAMS42" },
];

const WEEKLY = [
    { d: "M", v: 45 }, { d: "T", v: 60 }, { d: "O", v: 30 },
    { d: "T", v: 75 }, { d: "F", v: 20 }, { d: "L", v: 0 }, { d: "S", v: 50 },
];

const STREAK_WEEK = [true, true, true, true, true, false, true];


/* ═══════════════════════════════════════════════════════════════
   SVG ILLUSTRATIONS for course cards
   ═══════════════════════════════════════════════════════════════ */

function CalculusSVG() {
    return (
        <svg viewBox="0 0 200 160" fill="none" style={{ width: "100%", height: "100%", opacity: 0.25 }}>
            {/* Integral curve */}
            <path d="M20 140 Q50 80 80 100 T140 40 T180 80" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* dx notation */}
            <text x="150" y="130" fill="white" fontSize="18" fontFamily="serif" fontStyle="italic">∫ dx</text>
            {/* f(x) curve */}
            <path d="M10 120 C40 40, 80 140, 120 60 S180 100, 190 50" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" strokeDasharray="6 4" />
            {/* Coordinate dots */}
            <circle cx="80" cy="100" r="4" fill="white" opacity="0.6" />
            <circle cx="140" cy="40" r="4" fill="white" opacity="0.6" />
            {/* Axes hint */}
            <line x1="10" y1="145" x2="190" y2="145" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <line x1="15" y1="10" x2="15" y2="145" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
    );
}

function LinAlgSVG() {
    return (
        <svg viewBox="0 0 200 160" fill="none" style={{ width: "100%", height: "100%", opacity: 0.25 }}>
            {/* Matrix brackets */}
            <path d="M40 30 L30 30 L30 130 L40 130" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M120 30 L130 30 L130 130 L120 130" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Matrix elements */}
            <text x="50" y="60" fill="white" fontSize="16" fontFamily="serif">a₁₁</text>
            <text x="90" y="60" fill="white" fontSize="16" fontFamily="serif" opacity="0.6">a₁₂</text>
            <text x="50" y="90" fill="white" fontSize="16" fontFamily="serif" opacity="0.6">a₂₁</text>
            <text x="90" y="90" fill="white" fontSize="16" fontFamily="serif">a₂₂</text>
            {/* Eigenvector arrow */}
            <line x1="145" y1="110" x2="185" y2="50" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <polygon points="185,50 178,58 182,62" fill="white" />
            <text x="158" y="45" fill="white" fontSize="12" fontFamily="serif" fontStyle="italic">λv</text>
            {/* Vector notation */}
            <text x="50" y="120" fill="rgba(255,255,255,0.5)" fontSize="13" fontFamily="serif">det(A-λI)=0</text>
        </svg>
    );
}

function StatsSVG() {
    return (
        <svg viewBox="0 0 200 160" fill="none" style={{ width: "100%", height: "100%", opacity: 0.25 }}>
            {/* Bell curve */}
            <path d="M10 130 Q30 128 50 120 Q70 100 85 60 Q95 30 100 25 Q105 30 115 60 Q130 100 150 120 Q170 128 190 130" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Shaded area under curve */}
            <path d="M70 118 Q85 85 100 25 Q115 85 130 118 Z" fill="rgba(255,255,255,0.15)" />
            {/* Mean line */}
            <line x1="100" y1="25" x2="100" y2="140" stroke="white" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
            {/* Sigma markers */}
            <text x="64" y="150" fill="white" fontSize="11" fontFamily="serif">-σ</text>
            <text x="95" y="150" fill="white" fontSize="11" fontFamily="serif">μ</text>
            <text x="126" y="150" fill="white" fontSize="11" fontFamily="serif">+σ</text>
            {/* P notation */}
            <text x="140" y="40" fill="white" fontSize="14" fontFamily="serif" fontStyle="italic">P(X≤x)</text>
            {/* Axis */}
            <line x1="5" y1="135" x2="195" y2="135" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        </svg>
    );
}

const COURSE_SVG = { calculus: CalculusSVG, linalg: LinAlgSVG, stats: StatsSVG };


/* ═══════════════════════════════════════════════════════════════
   CONSTELLATION BACKGROUND (from landing page)
   ═══════════════════════════════════════════════════════════════ */

function ConstellationBG() {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let w, h, points = [], animId;

        function resize() {
            w = canvas.width = canvas.offsetWidth * 1;
            h = canvas.height = canvas.offsetHeight * 1;
        }

        function init() {
            resize();
            points = [];
            const count = Math.floor((w * h) / 18000);
            for (let i = 0; i < count; i++) {
                points.push({
                    x: Math.random() * w, y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.15,
                    vy: (Math.random() - 0.5) * 0.15,
                    r: Math.random() * 1.5 + 0.5,
                });
            }
        }

        function draw() {
            ctx.clearRect(0, 0, w, h);
            for (const p of points) {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(107,113,148,0.18)";
                ctx.fill();
            }
            for (let i = 0; i < points.length; i++) {
                for (let j = i + 1; j < points.length; j++) {
                    const dx = points[i].x - points[j].x;
                    const dy = points[i].y - points[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(points[i].x, points[i].y);
                        ctx.lineTo(points[j].x, points[j].y);
                        ctx.strokeStyle = `rgba(107,113,148,${0.06 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }
            animId = requestAnimationFrame(draw);
        }

        init();
        draw();
        window.addEventListener("resize", () => { resize(); });
        return () => cancelAnimationFrame(animId);
    }, []);

    return (
        <canvas ref={canvasRef} style={{
            position: "fixed", inset: 0, width: "100%", height: "100%",
            pointerEvents: "none", zIndex: 0
        }} />
    );
}


/* ═══════════════════════════════════════════════════════════════
   UTILITY COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function AnimNum({ value, dur = 700 }) {
    const [d, setD] = useState(0);
    useEffect(() => {
        let s = 0; const step = value / (dur / 16);
        const t = setInterval(() => {
            s += step;
            if (s >= value) { setD(value); clearInterval(t); }
            else setD(Math.floor(s));
        }, 16);
        return () => clearInterval(t);
    }, [value]);
    return <>{d}</>;
}

function Ring({ value, size = 48, sw = 4, color = C.blue, bg = C.border }) {
    const r = (size - sw) / 2;
    const circ = 2 * Math.PI * r;
    const off = circ - value * circ;
    return (
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={sw} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
                strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }} />
        </svg>
    );
}


/* ═══════════════════════════════════════════════════════════════
   SIDEBAR
   ═══════════════════════════════════════════════════════════════ */

function Sidebar({ active }) {
    const items = [
        { icon: <Home size={20} />, label: "Hem", id: "home" },
        { icon: <BookOpen size={20} />, label: "Mina studier", id: "studies" },
        { icon: <LineChart size={20} />, label: "Statistik", id: "stats" },
        { icon: <Library size={20} />, label: "Tentaarkiv", id: "archive" },
    ];

    return (
        <aside style={{
            width: 220, flexShrink: 0, height: "100vh",
            position: "sticky", top: 0,
            display: "flex", flexDirection: "column",
            background: "rgba(255,255,255,0.82)", backdropFilter: "blur(20px)",
            borderRight: `1px solid ${C.borderLight}`,
            padding: "24px 16px", zIndex: 10,
        }}>
            {/* Logo */}
            <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "0 8px", marginBottom: 36
            }}>
                <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 4px 14px ${C.blue}30`
                }}>
                    <span style={{ color: "#fff", fontWeight: 800, fontSize: 16, fontFamily: "var(--f-display)" }}>Q</span>
                </div>
                <span style={{
                    fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 20,
                    color: C.text, letterSpacing: "-0.03em"
                }}>Qmath</span>
                <span style={{
                    fontSize: 10, fontWeight: 600, fontFamily: "var(--f-body)",
                    background: C.blueLight, color: C.blue, padding: "2px 8px",
                    borderRadius: 6, marginLeft: 2
                }}>Beta</span>
            </div>

            {/* Nav Items */}
            <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {items.map(item => {
                    const isActive = item.id === active;
                    return (
                        <button key={item.id} style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "12px 14px", borderRadius: 12, border: "none",
                            background: isActive ? C.blue : "transparent",
                            color: isActive ? "#fff" : C.textSec,
                            fontFamily: "var(--f-body)", fontWeight: isActive ? 600 : 500,
                            fontSize: 14, cursor: "pointer", transition: "all 0.2s ease",
                            textAlign: "left"
                        }}
                            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = C.surfaceAlt; e.currentTarget.style.color = C.text; } }}
                            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSec; } }}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom section */}
            <div style={{ marginTop: "auto" }}>
                <button style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 12, border: "none",
                    background: "transparent", color: C.textMuted,
                    fontFamily: "var(--f-body)", fontWeight: 500, fontSize: 14,
                    cursor: "pointer", width: "100%", textAlign: "left"
                }}>
                    <Settings size={18} /> Inställningar
                </button>

                {/* User card */}
                <div style={{
                    marginTop: 12, padding: "14px",
                    background: C.surfaceAlt, borderRadius: 14,
                    display: "flex", alignItems: "center", gap: 10
                }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
                        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 15
                    }}>{USER.avatar}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 13, color: C.text }}>
                            {USER.name}
                        </div>
                        <div style={{ fontFamily: "var(--f-body)", fontSize: 11, color: C.textMuted }}>
                            Nivå {USER.level} · {USER.rank}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}


/* ═══════════════════════════════════════════════════════════════
   STREAK & PROGRESS HERO
   ═══════════════════════════════════════════════════════════════ */

function StreakHero() {
    return (
        <div style={{
            display: "grid", gridTemplateColumns: "1fr 320px", gap: 18
        }}>
            {/* Left: Weekly Activity Bar Chart */}
            <div style={{
                background: C.surface, borderRadius: 20, padding: "24px 28px",
                border: `1px solid ${C.borderLight}`, boxShadow: C.cardShadow
            }}>
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 20
                }}>
                    <h3 style={{
                        fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 20,
                        color: C.text, margin: 0
                    }}>Din utveckling</h3>
                    <div style={{
                        display: "flex", gap: 16, fontFamily: "var(--f-body)", fontSize: 13
                    }}>
                        <span style={{ color: C.text, fontWeight: 600 }}>
                            Totalt besvarade: <span style={{ color: C.blue }}>{USER.totalQuestions}</span>
                        </span>
                        <span style={{ color: C.text, fontWeight: 600 }}>
                            Rätt: <span style={{ color: C.green }}>{USER.accuracy}%</span>
                        </span>
                    </div>
                </div>

                {/* Bar Chart (CSS-only) */}
                <div style={{
                    display: "flex", alignItems: "flex-end", gap: 12,
                    height: 130, padding: "0 8px"
                }}>
                    {WEEKLY.map((w, i) => {
                        const maxV = Math.max(...WEEKLY.map(x => x.v));
                        const h = maxV > 0 ? (w.v / maxV) * 110 : 0;
                        return (
                            <div key={i} style={{
                                flex: 1, display: "flex", flexDirection: "column",
                                alignItems: "center", gap: 6
                            }}>
                                <span style={{
                                    fontFamily: "var(--f-body)", fontSize: 11, fontWeight: 600,
                                    color: w.v > 0 ? C.blue : C.textMuted
                                }}>
                                    {w.v > 0 ? `${w.v}m` : ""}
                                </span>
                                <div style={{
                                    width: "100%", maxWidth: 44, borderRadius: 8,
                                    height: Math.max(h, 6),
                                    background: w.v > 0
                                        ? `linear-gradient(180deg, ${C.blue}, ${C.purple}90)`
                                        : C.borderLight,
                                    transition: "height 0.8s cubic-bezier(.4,0,.2,1)",
                                    transitionDelay: `${i * 60}ms`,
                                    boxShadow: w.v > 0 ? `0 4px 12px ${C.blue}20` : "none"
                                }} />
                                <span style={{
                                    fontFamily: "var(--f-body)", fontSize: 12, fontWeight: 500,
                                    color: C.textMuted
                                }}>{w.d}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right: Streak Card (warm, gamified) */}
            <div style={{
                background: "linear-gradient(135deg, #5B2C1E 0%, #8B3A1F 40%, #C2562D 100%)",
                borderRadius: 20, padding: "24px 28px",
                position: "relative", overflow: "hidden",
                display: "flex", flexDirection: "column", justifyContent: "space-between"
            }}>
                {/* Glow effects */}
                <div style={{
                    position: "absolute", top: -30, right: -30,
                    width: 120, height: 120, borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(255,160,60,0.3), transparent 70%)"
                }} />

                <div>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 6, marginBottom: 12
                    }}>
                        <span style={{ fontSize: 28 }}>🔥</span>
                        <span style={{
                            fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 14,
                            color: "rgba(255,255,255,0.7)", textTransform: "uppercase",
                            letterSpacing: "0.08em"
                        }}>Streak denna vecka</span>
                    </div>

                    {/* Fire emoji row for each day */}
                    <div style={{
                        display: "flex", gap: 6, marginBottom: 16
                    }}>
                        {STREAK_WEEK.map((active, i) => (
                            <div key={i} style={{
                                fontSize: 26, filter: active ? "none" : "grayscale(1) opacity(0.3)",
                                transition: "all 0.3s ease",
                                transitionDelay: `${i * 80}ms`
                            }}>🔥</div>
                        ))}
                    </div>
                </div>

                {/* Bottom stats */}
                <div style={{
                    display: "flex", gap: 20, alignItems: "flex-end"
                }}>
                    <div>
                        <div style={{
                            fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 48,
                            color: "#fff", lineHeight: 1
                        }}>{USER.streak}</div>
                        <div style={{
                            fontFamily: "var(--f-body)", fontSize: 13, color: "rgba(255,255,255,0.6)",
                            marginTop: 2
                        }}>Total streak</div>
                    </div>
                    <div style={{
                        padding: "10px 16px", borderRadius: 14,
                        background: "rgba(255,255,255,0.12)",
                        backdropFilter: "blur(8px)",
                        display: "flex", alignItems: "center", gap: 10
                    }}>
                        <span style={{ fontSize: 28 }}>🐣</span>
                        <div>
                            <div style={{
                                fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 14,
                                color: "#fff"
                            }}>{USER.rank}</div>
                            <div style={{
                                fontFamily: "var(--f-body)", fontSize: 11,
                                color: "rgba(255,255,255,0.5)"
                            }}>Nivå {USER.level}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


/* ═══════════════════════════════════════════════════════════════
   COURSE CARDS (Colorful with illustrations)
   ═══════════════════════════════════════════════════════════════ */

function CourseCard({ course }) {
    const SVG = COURSE_SVG[course.bgPattern];
    const readColor = course.readiness >= 60 ? "#fff" : course.readiness >= 35 ? "rgba(255,255,255,0.9)" : "rgba(255,200,200,1)";

    return (
        <div style={{
            borderRadius: 20, overflow: "hidden",
            cursor: "pointer", transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
            position: "relative"
        }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-6px) scale(1.01)";
                e.currentTarget.style.boxShadow = "0 20px 50px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            {/* Main gradient area */}
            <div style={{
                background: course.gradient,
                padding: "24px 24px 18px",
                position: "relative", minHeight: 200,
                display: "flex", flexDirection: "column", justifyContent: "space-between"
            }}>
                {/* Review badge */}
                {course.reviews > 0 && (
                    <div style={{
                        position: "absolute", top: 16, right: 16,
                        width: 30, height: 30, borderRadius: "50%",
                        background: "#EF4444", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 13,
                        boxShadow: "0 3px 10px rgba(239,68,68,0.4)",
                        border: "2px solid rgba(255,255,255,0.3)"
                    }}>{course.reviews}</div>
                )}

                {/* Course info */}
                <div style={{ position: "relative", zIndex: 2 }}>
                    <div style={{
                        fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 22,
                        color: "#fff", letterSpacing: "-0.02em"
                    }}>{course.code}</div>
                    <div style={{
                        fontFamily: "var(--f-body)", fontWeight: 400, fontSize: 13,
                        color: "rgba(255,255,255,0.75)", marginTop: 2
                    }}>{course.subtitle}</div>
                </div>

                {/* SVG Illustration */}
                <div style={{
                    position: "absolute", bottom: 0, right: 0, left: 0, top: 0,
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    {SVG && <SVG />}
                </div>

                {/* Bottom stats row */}
                <div style={{
                    position: "relative", zIndex: 2,
                    display: "flex", justifyContent: "space-between", alignItems: "flex-end"
                }}>
                    <div>
                        <div style={{
                            fontFamily: "var(--f-body)", fontSize: 11, color: "rgba(255,255,255,0.6)",
                            marginBottom: 2
                        }}>Tentaberedskap</div>
                        <div style={{
                            fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 28,
                            color: readColor
                        }}>{course.readiness}%</div>
                    </div>
                    <div style={{
                        padding: "6px 12px", borderRadius: 10,
                        background: "rgba(255,255,255,0.18)",
                        backdropFilter: "blur(6px)",
                        fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 12,
                        color: "#fff", display: "flex", alignItems: "center", gap: 5
                    }}>
                        <Calendar size={13} /> {course.daysLeft}d kvar
                    </div>
                </div>
            </div>

            {/* Bottom white strip */}
            <div style={{
                background: C.surface, padding: "14px 24px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                borderTop: `1px solid ${C.borderLight}`
            }}>
                <div style={{
                    fontFamily: "var(--f-body)", fontSize: 13, color: C.textSec
                }}>
                    <strong style={{ color: C.text }}>{course.topicsMastered}</strong>/{course.topicsTotal} ämnen klara
                </div>
                <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 13,
                    color: C.blue
                }}>
                    Fortsätt <ArrowRight size={14} />
                </div>
            </div>
        </div>
    );
}


/* ═══════════════════════════════════════════════════════════════
   MASTERY MAP
   ═══════════════════════════════════════════════════════════════ */

function MasteryMap() {
    const [filter, setFilter] = useState("all");
    const courses = ["all", "TATA41", "TATA24", "TAMS42"];
    const filtered = filter === "all"
        ? MASTERY_TOPICS
        : MASTERY_TOPICS.filter(t => t.course === filter);
    const sorted = [...filtered].sort((a, b) => b.m - a.m);

    const getStyle = (m) => {
        if (m >= 0.9) return { bg: "#ECFDF5", border: "#10B981", text: "#059669", icon: "✓" };
        if (m >= 0.6) return { bg: "#EFF6FF", border: "#3B82F6", text: "#2563EB", icon: "↗" };
        if (m >= 0.3) return { bg: "#FFFBEB", border: "#F59E0B", text: "#B45309", icon: "◐" };
        return { bg: "#FEF2F2", border: "#EF4444", text: "#DC2626", icon: "!" };
    };

    return (
        <div style={{
            background: C.surface, borderRadius: 20, padding: "28px",
            border: `1px solid ${C.borderLight}`, boxShadow: C.cardShadow
        }}>
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 20
            }}>
                <div>
                    <h3 style={{
                        fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 20,
                        color: C.text, margin: 0
                    }}>Kunskapskarta</h3>
                    <p style={{
                        fontFamily: "var(--f-body)", fontSize: 13, color: C.textMuted, margin: "4px 0 0"
                    }}>Bayesian Knowledge Tracing — din verkliga förståelsenivå</p>
                </div>
                {/* Course filter chips */}
                <div style={{ display: "flex", gap: 6 }}>
                    {courses.map(c => (
                        <button key={c} onClick={() => setFilter(c)} style={{
                            padding: "6px 14px", borderRadius: 8, border: "none",
                            background: filter === c ? C.blue : C.surfaceAlt,
                            color: filter === c ? "#fff" : C.textSec,
                            fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 12,
                            cursor: "pointer", transition: "all 0.15s ease"
                        }}>
                            {c === "all" ? "Alla" : c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                {[
                    { color: "#10B981", label: "Bemästrad ≥90%" },
                    { color: "#3B82F6", label: "Inlärning 60–89%" },
                    { color: "#F59E0B", label: "Utvecklas 30–59%" },
                    { color: "#EF4444", label: "Behöver fokus <30%" },
                ].map((l, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
                        <span style={{ fontFamily: "var(--f-body)", fontSize: 11, color: C.textMuted }}>{l.label}</span>
                    </div>
                ))}
            </div>

            {/* Topic grid */}
            <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))",
                gap: 10
            }}>
                {sorted.map(topic => {
                    const s = getStyle(topic.m);
                    return (
                        <div key={topic.id} style={{
                            padding: "14px 16px", borderRadius: 14,
                            background: s.bg, border: `1.5px solid ${s.border}25`,
                            cursor: "pointer", transition: "all 0.2s ease"
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.borderColor = s.border + "60";
                                e.currentTarget.style.boxShadow = `0 6px 18px ${s.border}18`;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.borderColor = s.border + "25";
                                e.currentTarget.style.boxShadow = "none";
                            }}
                        >
                            <div style={{
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                marginBottom: 8
                            }}>
                                <span style={{
                                    fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 11,
                                    color: s.text, opacity: 0.7
                                }}>{topic.course}</span>
                                <span style={{
                                    fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 15,
                                    color: s.text
                                }}>{Math.round(topic.m * 100)}%</span>
                            </div>
                            <div style={{
                                fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 13,
                                color: C.text, marginBottom: 10, lineHeight: 1.3
                            }}>{topic.name}</div>
                            <div style={{
                                height: 4, borderRadius: 99, background: s.border + "20"
                            }}>
                                <div style={{
                                    height: "100%", borderRadius: 99,
                                    width: `${topic.m * 100}%`, background: s.border,
                                    transition: "width 0.8s ease"
                                }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


/* ═══════════════════════════════════════════════════════════════
   QUICK ACTIONS + AI CARD
   ═══════════════════════════════════════════════════════════════ */

function QuickActions() {
    const totalReviews = COURSES.reduce((s, c) => s + c.reviews, 0);
    const actions = [
        { icon: <Brain size={20} />, label: "Adaptiv övning", desc: "AI väljer optimal nivå", color: C.blue, primary: true },
        { icon: <RefreshCw size={20} />, label: `Repetition (${totalReviews})`, desc: "Spaced repetition", color: C.orange, badge: totalReviews },
        { icon: <FileText size={20} />, label: "Tentasimulering", desc: "Öva under tentavillkor", color: C.purple },
    ];

    return (
        <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 18
        }}>
            {/* Actions */}
            <div style={{
                background: C.surface, borderRadius: 20, padding: 28,
                border: `1px solid ${C.borderLight}`, boxShadow: C.cardShadow
            }}>
                <h3 style={{
                    fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 20,
                    color: C.text, margin: "0 0 16px"
                }}>Börja studera</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {actions.map((a, i) => (
                        <button key={i} style={{
                            display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                            background: a.primary ? a.color : C.surfaceAlt,
                            border: a.primary ? "none" : `1px solid ${C.borderLight}`,
                            borderRadius: 14, cursor: "pointer", textAlign: "left",
                            transition: "all 0.2s ease"
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${a.color}20`; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                        >
                            <div style={{
                                width: 40, height: 40, borderRadius: 10,
                                background: a.primary ? "rgba(255,255,255,0.2)" : a.color + "12",
                                color: a.primary ? "#fff" : a.color,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0, position: "relative"
                            }}>
                                {a.icon}
                                {a.badge > 0 && (
                                    <div style={{
                                        position: "absolute", top: -4, right: -4,
                                        width: 18, height: 18, borderRadius: 9, background: C.red, color: "#fff",
                                        fontSize: 10, fontWeight: 700, fontFamily: "var(--f-body)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        border: "2px solid " + C.surfaceAlt
                                    }}>{a.badge}</div>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 14,
                                    color: a.primary ? "#fff" : C.text
                                }}>{a.label}</div>
                                <div style={{
                                    fontFamily: "var(--f-body)", fontSize: 12,
                                    color: a.primary ? "rgba(255,255,255,0.7)" : C.textMuted
                                }}>{a.desc}</div>
                            </div>
                            <ArrowRight size={16} color={a.primary ? "rgba(255,255,255,0.5)" : C.textMuted} />
                        </button>
                    ))}
                </div>
            </div>

            {/* AI Recommendation Card */}
            <div style={{
                background: "linear-gradient(135deg, #1A1D2E 0%, #2A2F4A 100%)",
                borderRadius: 20, padding: 28, position: "relative", overflow: "hidden",
                display: "flex", flexDirection: "column", justifyContent: "space-between"
            }}>
                {/* Subtle constellation overlay */}
                <div style={{
                    position: "absolute", inset: 0, opacity: 0.06,
                    backgroundImage: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.8) 1px, transparent 1px),
            radial-gradient(circle at 70% 60%, rgba(255,255,255,0.8) 1px, transparent 1px),
            radial-gradient(circle at 50% 80%, rgba(255,255,255,0.8) 1px, transparent 1px)`,
                    backgroundSize: "80px 80px, 60px 60px, 90px 90px"
                }} />

                <div style={{ position: "relative" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "5px 12px", borderRadius: 8,
                        background: `${C.blue}25`, marginBottom: 16
                    }}>
                        <Sparkles size={14} color={C.blueLight} />
                        <span style={{
                            fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 12,
                            color: "#A5B4FC"
                        }}>AI-rekommendation</span>
                    </div>

                    <h3 style={{
                        fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 20,
                        color: "#fff", margin: "0 0 10px", lineHeight: 1.4
                    }}>Fokusera på Differentialekvationer</h3>

                    <p style={{
                        fontFamily: "var(--f-body)", fontSize: 13, color: "#8890B5",
                        margin: "0 0 24px", lineHeight: 1.6
                    }}>
                        Din mastery ligger på <strong style={{ color: C.orange }}>34%</strong>. Detta ämne
                        har hög vikt på TATA41-tentan om <strong style={{ color: "#fff" }}>34 dagar</strong>.
                    </p>
                </div>

                <button style={{
                    padding: "13px 24px", borderRadius: 12,
                    background: C.blue, border: "none",
                    fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 14,
                    color: "#fff", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                    boxShadow: `0 4px 16px ${C.blue}40`,
                    transition: "all 0.2s ease", alignSelf: "flex-start"
                }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 28px ${C.blue}50`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 16px ${C.blue}40`; }}
                >
                    <Play size={16} /> Starta session
                </button>
            </div>
        </div>
    );
}


/* ═══════════════════════════════════════════════════════════════
   FLOATING MATH EQUATIONS (from landing page)
   ═══════════════════════════════════════════════════════════════ */

function FloatingEquations() {
    const eqs = [
        { text: "e^{iπ} + 1 = 0", display: "eⁱᵖ + 1 = 0", x: "2%", y: "15%", rot: -3 },
        { text: "∇ · E = ρ/ε₀", display: "∇·E = ρ/ε₀", x: "88%", y: "60%", rot: 2 },
    ];

    return (
        <>
            {eqs.map((eq, i) => (
                <div key={i} style={{
                    position: "fixed", left: eq.x, top: eq.y,
                    padding: "10px 18px", borderRadius: 12,
                    background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)",
                    border: "1px solid rgba(228,231,241,0.6)",
                    fontFamily: "'Cambria Math', 'Latin Modern Math', Georgia, serif",
                    fontSize: 14, color: C.textSec, fontStyle: "italic",
                    transform: `rotate(${eq.rot}deg)`,
                    zIndex: 1, pointerEvents: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                }}>
                    {eq.display}
                </div>
            ))}
        </>
    );
}


/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

export default function QmathDashboardV2() {
    const [loaded, setLoaded] = useState(false);
    useEffect(() => { setTimeout(() => setLoaded(true), 50); }, []);

    return (
        <div style={{
            minHeight: "100vh", background: C.bg,
            display: "flex", position: "relative"
        }}>
            {/* CSS Custom Properties for fonts */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');
        :root {
          --f-display: 'DM Serif Display', Georgia, serif;
          --f-body: 'DM Sans', -apple-system, sans-serif;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 99px; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-section {
          animation: fadeUp 0.6s cubic-bezier(.4,0,.2,1) both;
        }
      `}</style>

            {/* Background layers */}
            <ConstellationBG />
            <FloatingEquations />

            {/* Sidebar */}
            <Sidebar active="home" />

            {/* Main Content */}
            <main style={{
                flex: 1, padding: "28px 36px 64px",
                position: "relative", zIndex: 5,
                maxWidth: 1060, minWidth: 0,
            }}>
                {/* Top bar */}
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 28,
                    opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(10px)",
                    transition: "all 0.5s cubic-bezier(.4,0,.2,1)"
                }}>
                    <div>
                        <h1 style={{
                            fontFamily: "var(--f-display)", fontWeight: 400, fontSize: 28,
                            color: C.text, margin: 0, letterSpacing: "-0.01em"
                        }}>
                            God kväll, {USER.name}
                        </h1>
                        <p style={{
                            fontFamily: "var(--f-body)", fontSize: 14, color: C.textMuted, marginTop: 4
                        }}>
                            Du har <strong style={{ color: C.blue }}>{COURSES.reduce((s, c) => s + c.reviews, 0)} repetitioner</strong> som väntar — håll din streak vid liv!
                        </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {/* Search */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "9px 16px", borderRadius: 12,
                            background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)",
                            border: `1px solid ${C.borderLight}`, width: 200
                        }}>
                            <Search size={16} color={C.textMuted} />
                            <span style={{ fontFamily: "var(--f-body)", fontSize: 13, color: C.textMuted }}>Sök...</span>
                        </div>
                        {/* Bell */}
                        <button style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)",
                            border: `1px solid ${C.borderLight}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", position: "relative"
                        }}>
                            <Bell size={18} color={C.textSec} />
                            <div style={{
                                position: "absolute", top: 6, right: 6,
                                width: 8, height: 8, borderRadius: 4,
                                background: C.red, border: `2px solid ${C.surface}`
                            }} />
                        </button>
                    </div>
                </div>

                {/* XP Bar */}
                <div style={{
                    marginBottom: 28,
                    opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(10px)",
                    transition: "all 0.5s cubic-bezier(.4,0,.2,1) 0.1s"
                }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 14,
                        background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)",
                        borderRadius: 14, padding: "12px 20px",
                        border: `1px solid ${C.borderLight}`
                    }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 9,
                            background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
                            color: "#fff", fontFamily: "var(--f-display)",
                            fontWeight: 400, fontSize: 16,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: `0 3px 10px ${C.blue}30`
                        }}>{USER.level}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                height: 8, borderRadius: 99, background: C.borderLight,
                                overflow: "hidden"
                            }}>
                                <div style={{
                                    height: "100%", borderRadius: 99,
                                    width: `${(USER.xp / USER.xpToNext) * 100}%`,
                                    background: `linear-gradient(90deg, ${C.blue}, ${C.purple})`,
                                    transition: "width 1.5s cubic-bezier(.4,0,.2,1)"
                                }} />
                            </div>
                        </div>
                        <span style={{
                            fontFamily: "var(--f-body)", fontSize: 12, fontWeight: 600,
                            color: C.textSec
                        }}>{USER.xp} / {USER.xpToNext} XP</span>
                        <Zap size={16} color={C.yellow} />
                    </div>
                </div>

                {/* ─── STREAK + PROGRESS ─── */}
                <div className="fade-section" style={{
                    marginBottom: 28, animationDelay: "0.15s",
                    opacity: loaded ? undefined : 0
                }}>
                    <StreakHero />
                </div>

                {/* ─── COURSES ─── */}
                <div className="fade-section" style={{
                    marginBottom: 28, animationDelay: "0.25s",
                    opacity: loaded ? undefined : 0
                }}>
                    <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        marginBottom: 16
                    }}>
                        <h2 style={{
                            fontFamily: "var(--f-display)", fontWeight: 400, fontSize: 22,
                            color: C.text, margin: 0
                        }}>Aktiva kurser</h2>
                        <button style={{
                            fontFamily: "var(--f-body)", fontSize: 13, fontWeight: 600,
                            color: C.blue, background: "none", border: "none",
                            cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                        }}>
                            Visa mer <ChevronRight size={16} />
                        </button>
                    </div>
                    <div style={{
                        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18
                    }}>
                        {COURSES.map(c => <CourseCard key={c.id} course={c} />)}
                    </div>
                </div>

                {/* ─── QUICK ACTIONS + AI ─── */}
                <div className="fade-section" style={{
                    marginBottom: 28, animationDelay: "0.35s",
                    opacity: loaded ? undefined : 0
                }}>
                    <QuickActions />
                </div>

                {/* ─── MASTERY MAP ─── */}
                <div className="fade-section" style={{
                    animationDelay: "0.45s",
                    opacity: loaded ? undefined : 0
                }}>
                    <MasteryMap />
                </div>
            </main>
        </div>
    );
}
import { Music2, Sparkles } from "lucide-react";
import type { CSSProperties } from "react";

const RAGA_GRADIENT = "linear-gradient(135deg, #d97706 0%, #8b3a1c 100%)";

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-amber-200/60 bg-white/70 shadow-soft backdrop-blur-sm">
      <div className="h-2" style={{ background: RAGA_GRADIENT }} aria-hidden />

      <FloatingSwaras />

      <div className="relative z-10 grid gap-10 px-6 py-10 md:grid-cols-[1.3fr_1fr] md:items-center md:gap-12 md:px-12 md:py-14">
        <div>
          <BrandMark />

          <h1
            className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-stone-900 md:text-6xl"
            style={{ fontFamily: "Fraunces, Georgia, serif" }}
          >
            <span className="text-gradient-raga">YouTube</span>{" "}
            <span>to Sitar notation.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-700 md:text-lg">
            Paste a song. Get a Bhatkhande-style transcription with lyrics that line up over every
            swara, ornaments on the right notes, and fret guidance for your sitar.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            <Pill color="#d97706">Bhatkhande short notation</Pill>
            <Pill color="#1e6f7b">Aligned lyrics</Pill>
            <Pill color="#8b3a1c">Sitar fret guidance</Pill>
            <Pill color="#3f3f46">Meend · Kan · Murki</Pill>
          </div>

          <div
            className="mt-7 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-sm text-stone-700 shadow-sm"
            style={{ backdropFilter: "blur(8px)" }}
          >
            <Sparkles className="h-4 w-4" style={{ color: "#d97706" }} />
            <span>
              Designed for sitar students. <strong>Free</strong> and runs locally.
            </span>
          </div>
        </div>

        <SitarIllustration />
      </div>
    </section>
  );
}

function BrandMark() {
  return (
    <div className="inline-flex items-center gap-3">
      <span
        className="grid h-14 w-14 place-items-center rounded-2xl"
        style={{
          background: RAGA_GRADIENT,
          color: "#fff8ec",
          boxShadow: "0 14px 32px rgba(217, 119, 6, 0.38)",
        }}
      >
        <Music2 className="h-7 w-7" strokeWidth={2.5} />
      </span>
      <span className="flex flex-col">
        <span
          className="text-[0.7rem] font-bold uppercase leading-tight tracking-[0.32em]"
          style={{ color: "#d97706" }}
        >
          AI Sitar
        </span>
        <span
          className="text-xl font-bold leading-tight text-stone-900"
          style={{ fontFamily: "Fraunces, Georgia, serif" }}
        >
          Transcribe · Practice
        </span>
      </span>
    </div>
  );
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        background: `${color}14`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {children}
    </span>
  );
}

function FloatingSwaras() {
  const swaras: Array<{
    glyph: string;
    color: string;
    opacity: number;
    size: string;
    position: CSSProperties;
    delay: string;
  }> = [
    { glyph: "S\u0307", color: "#d97706", opacity: 0.16, size: "5.5rem", position: { top: "8%", left: "4%" }, delay: "0s" },
    { glyph: "R\u0332", color: "#8b3a1c", opacity: 0.14, size: "4rem", position: { top: "18%", left: "26%" }, delay: "1.2s" },
    { glyph: "G", color: "#1e6f7b", opacity: 0.18, size: "5rem", position: { top: "6%", right: "42%" }, delay: "0.6s" },
    { glyph: "M\u030d", color: "#d97706", opacity: 0.2, size: "4.5rem", position: { top: "22%", right: "8%" }, delay: "1.8s" },
    { glyph: "P\u0323", color: "#8b3a1c", opacity: 0.16, size: "5rem", position: { bottom: "10%", left: "10%" }, delay: "2.4s" },
    { glyph: "D\u0332\u0323", color: "#1e6f7b", opacity: 0.18, size: "4rem", position: { bottom: "6%", right: "26%" }, delay: "3s" },
    { glyph: "N\u0307", color: "#18120f", opacity: 0.1, size: "3.5rem", position: { bottom: "26%", right: "6%" }, delay: "0.9s" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden>
      {swaras.map((s, i) => (
        <span
          key={i}
          className="absolute font-black animate-float-soft"
          style={{
            ...s.position,
            color: s.color,
            opacity: s.opacity,
            fontSize: s.size,
            fontFamily: "Fraunces, Georgia, serif",
            animationDelay: s.delay,
          }}
        >
          {s.glyph}
        </span>
      ))}
    </div>
  );
}

function SitarIllustration() {
  return (
    <div className="relative mx-auto h-80 w-48 md:h-[28rem] md:w-64">
      <div
        className="absolute inset-x-0 top-1/2 h-72 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at center, rgba(217,119,6,0.32) 0%, rgba(139,58,28,0.10) 45%, transparent 75%)",
        }}
        aria-hidden
      />

      <svg
        viewBox="0 0 200 480"
        className="relative h-full w-full"
        style={{ filter: "drop-shadow(0 22px 28px rgba(139, 58, 28, 0.25))" }}
        aria-label="Sitar"
      >
        <defs>
          <linearGradient id="tumba-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="35%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#8b3a1c" />
          </linearGradient>
          <linearGradient id="neck-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b3a1c" />
            <stop offset="100%" stopColor="#5e2410" />
          </linearGradient>
          <radialGradient id="rosette-grad" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#18120f" />
            <stop offset="100%" stopColor="#3b1f10" />
          </radialGradient>
        </defs>

        {/* Tuning head */}
        <g>
          <path d="M68 14 Q100 4 132 14 L134 56 Q132 64 100 64 Q68 64 66 56 Z" fill="url(#neck-grad)" />
          <g fill="#fbbf24">
            <rect x="74" y="40" width="52" height="3" rx="1.5" opacity="0.5" />
            <rect x="74" y="50" width="52" height="3" rx="1.5" opacity="0.5" />
          </g>
          {/* Tuning pegs */}
          <g fill="#18120f">
            <ellipse cx="60" cy="24" rx="6" ry="2.5" />
            <ellipse cx="140" cy="24" rx="6" ry="2.5" />
            <ellipse cx="58" cy="38" rx="6" ry="2.5" />
            <ellipse cx="142" cy="38" rx="6" ry="2.5" />
            <ellipse cx="56" cy="52" rx="6" ry="2.5" />
            <ellipse cx="144" cy="52" rx="6" ry="2.5" />
          </g>
        </g>

        {/* Nut */}
        <rect x="86" y="64" width="28" height="5" rx="1.5" fill="#18120f" />

        {/* Neck */}
        <rect x="86" y="69" width="28" height="245" rx="3" fill="url(#neck-grad)" />

        {/* Side ornament strips */}
        <rect x="84" y="69" width="2.5" height="245" fill="#fbbf24" opacity="0.4" />
        <rect x="113.5" y="69" width="2.5" height="245" fill="#fbbf24" opacity="0.4" />

        {/* Strings */}
        <g className="animate-string-pluck" stroke="#fff8ec" strokeWidth="0.7">
          <line x1="91" y1="64" x2="91" y2="335" opacity="0.85" />
          <line x1="95" y1="64" x2="95" y2="335" opacity="0.85" />
          <line x1="100" y1="64" x2="100" y2="335" opacity="0.85" />
          <line x1="105" y1="64" x2="105" y2="335" opacity="0.85" />
          <line x1="109" y1="64" x2="109" y2="335" opacity="0.85" />
        </g>

        {/* Frets (curved arches) */}
        <g stroke="#fbbf24" strokeWidth="1.8" fill="none" opacity="0.95">
          {Array.from({ length: 14 }).map((_, i) => {
            const y = 88 + i * 17;
            return <path key={i} d={`M82 ${y} Q100 ${y - 5} 118 ${y}`} />;
          })}
        </g>

        {/* Bridge */}
        <rect x="76" y="338" width="48" height="7" rx="2" fill="#18120f" />
        <rect x="78" y="336" width="44" height="2" fill="#fbbf24" opacity="0.6" />

        {/* Tumba (gourd) */}
        <ellipse cx="100" cy="405" rx="78" ry="62" fill="url(#tumba-grad)" />
        <ellipse cx="100" cy="405" rx="62" ry="50" fill="#8b3a1c" opacity="0.55" />
        <ellipse cx="100" cy="405" rx="42" ry="34" fill="#5e2410" opacity="0.4" />

        {/* Sound hole */}
        <circle cx="100" cy="405" r="12" fill="url(#rosette-grad)" />
        <circle cx="100" cy="405" r="7" fill="#18120f" />
        <circle cx="100" cy="405" r="2.5" fill="#fbbf24" opacity="0.7" />

        {/* Tumba ornament dots */}
        <g fill="#fbbf24" opacity="0.85">
          <circle cx="68" cy="385" r="1.8" />
          <circle cx="132" cy="385" r="1.8" />
          <circle cx="60" cy="408" r="1.8" />
          <circle cx="140" cy="408" r="1.8" />
          <circle cx="68" cy="430" r="1.8" />
          <circle cx="132" cy="430" r="1.8" />
          <circle cx="100" cy="358" r="1.8" />
          <circle cx="100" cy="455" r="1.8" />
        </g>

        {/* Floating music notes */}
        <g fill="#1e6f7b" opacity="0.85">
          <g transform="translate(155, 90)">
            <circle cx="0" cy="10" r="3.5" />
            <rect x="3" y="-6" width="1.5" height="16" />
            <path d="M3 -6 Q12 -2 8 6 Z" />
          </g>
          <g transform="translate(28, 180)">
            <circle cx="0" cy="10" r="3" />
            <rect x="2.5" y="-4" width="1.2" height="14" />
            <path d="M2.5 -4 Q10 0 7 6 Z" />
          </g>
          <g transform="translate(168, 220)">
            <circle cx="0" cy="10" r="3" />
            <rect x="2.5" y="-4" width="1.2" height="14" />
          </g>
        </g>
      </svg>
    </div>
  );
}

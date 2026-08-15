"use client";

import { Space_Grotesk, Inter } from "next/font/google";
import { ShinyButton } from "@/components/ui/shiny-button";
import Image from "next/image";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
});

const NAV_LINKS = ["Projects", "Career", "About"];

const SECTORS = [
  "Education",
  "Civic & Urban Infrastructure",
  "Corporate Campuses",
  "Healthcare",
  "Transportation & Mobility",
];

const STATS = [
  { value: "24", label: "Years of\nExpertise" },
  { value: "357", label: "Completed\nProjects" },
];

function FacadeArt() {
  const barCount = 46;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const t = i / (barCount - 1);
    const roofline = 60 + Math.sin(t * Math.PI) * 90 + Math.pow(t, 2.2) * 40;
    const rotate = -14 + t * 22;
    const tone = i % 5 === 0 ? "var(--facade-accent)" : "var(--facade-ink)";
    return { x: 12 + t * 1176, height: 260 + roofline, rotate, tone };
  });

  return (
    <svg
      viewBox="0 0 1200 360"
      className="block h-full w-full"
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-label="Abstract illustration of an angled architectural facade"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c7d3e0" />
          <stop offset="100%" stopColor="#e9edf2" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1200" height="360" fill="url(#sky)" />
      {bars.map((bar, i) => (
        <rect
          key={i}
          x={bar.x}
          y={360 - bar.height}
          width="14"
          height={bar.height}
          rx="1.5"
          fill={bar.tone}
          transform={`rotate(${bar.rotate} ${bar.x + 7} 360)`}
          className="facade-bar"
          style={{ animationDelay: `${i * 18}ms` }}
        />
      ))}
    </svg>
  );
}

export default function Hero() {
  return (
    <section
      className="min-h-screen w-full bg-[#e6e6ea]"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <style>{`
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes barRise {
          from { opacity: 0; transform-origin: bottom center; transform: scaleY(0.4) translateY(20px); }
          to { opacity: 1; transform: scaleY(1) translateY(0); }
        }
        .rise-in { animation: riseIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .facade-bar { animation: barRise 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .rise-in, .facade-bar { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      <div
        className={`${display.variable} ${body.variable} mx-auto w-full max-w-6xl overflow-hidden bg-white`}
        style={
          {
            "--facade-ink": "#14141a",
            "--facade-accent": "#a9754f",
          } as React.CSSProperties
        }
      >
        <nav className="rise-in flex items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6 md:px-10">
          <ul className="flex items-center gap-3 sm:gap-6">
            {NAV_LINKS.map((link) => (
              <li key={link}>
                <a
                  href="#"
                  className="text-[10px] font-medium uppercase tracking-[0.1em] text-neutral-800 transition-colors hover:text-neutral-500 sm:text-[11px] sm:tracking-[0.14em]"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>

          <ShinyButton
            href="#contact"
            showArrow={false}
            className="relative z-10 h-9 rounded-full border-[#14141a] bg-[#14141a] px-4 text-[10px] font-medium uppercase tracking-[0.1em] text-white shadow-sm transition-shadow duration-300 hover:shadow-md hover:ring-[#14141a] focus:ring-[#14141a] sm:h-10 sm:px-6 sm:text-[11px]"
          >
            Contact us
          </ShinyButton>
        </nav>

        <div className="mt-10 md:mt-4  px-6 pb-14 pt-6 text-center md:px-10 md:pb-20 md:pt-10">
          <h1
            className="rise-in mt-4 md:mt-0 text-[2.55rem] font-bold uppercase leading-none tracking-tight text-[#14141a] md:text-[3.5rem]"
            style={{ fontFamily: "var(--font-display)", animationDelay: "80ms" }}
          >
            Archi<span aria-hidden="true">Ø</span>n
            <span className="sr-only">Archion</span>
          </h1>

          <p
            className="rise-in mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-neutral-500"
            style={{ animationDelay: "150ms" }}
          >
            Deliver large-scale architectural and construction projects that
            shape cities, communities, and industries.
          </p>

          <dl
            className="rise-in mt-8 flex items-start justify-center gap-10"
            style={{ animationDelay: "220ms" }}
          >
            {STATS.map((stat) => (
              <div key={stat.value} className="flex items-center gap-3">
                <dt className="text-3xl font-semibold tabular-nums text-[#14141a] md:text-4xl">
                  {stat.value}
                </dt>
                <dd className="text-left text-[10px] font-medium uppercase leading-tight tracking-[0.08em] text-neutral-500">
                  {stat.label.split("\n").map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>

          <ul
            className="rise-in mt-10 flex flex-wrap items-center justify-center gap-2"
            style={{ animationDelay: "290ms" }}
          >
            {SECTORS.map((sector) => (
              <li key={sector}>
                <button
                  type="button"
                  className="rounded-full border border-neutral-200 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.05em] text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-900"
                >
                  {sector}
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                aria-label="Show more sectors"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-900"
              >
                <span className=" text-lg leading-none">...</span>
              </button>
            </li>
          </ul>
        </div>

        <div className="h-[260px] w-full md:h-[380px]">
          <Image
            src="/hero.jpg"
            alt="Aerial view of a modern architectural complex with multiple buildings and green spaces"
            width={1200}
            height={380}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
"use client";

import { useInView } from "react-intersection-observer";
import { Space_Grotesk } from "next/font/google";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
});

type Project = {
  title: string;
  location: string;
  sector: string;
  tone: "ink" | "bronze" | "slate";
};

const PROJECTS: Project[] = [
  { title: "Meridian Transit Hub", location: "Lagos, NG", sector: "Civic & Urban Infrastructure", tone: "ink" },
  { title: "Okhai Research Campus", location: "Abuja, NG", sector: "Education", tone: "bronze" },
  { title: "Harrow Corporate Park", location: "Nairobi, KE", sector: "Corporate Campuses", tone: "slate" },
  { title: "Coastview Medical Center", location: "Accra, GH", sector: "Healthcare", tone: "bronze" },
  { title: "Ridgeline Community Library", location: "Kigali, RW", sector: "Education", tone: "ink" },
  { title: "Delta Freight Interchange", location: "Port Harcourt, NG", sector: "Transportation & Mobility", tone: "slate" },
];

const TONE_STYLES: Record<Project["tone"], { bg: string; bars: string }> = {
  ink: { bg: "#14141a", bars: "#3a3a44" },
  bronze: { bg: "#a9754f", bars: "#c79a76" },
  slate: { bg: "#5b636f", bars: "#818b98" },
};

function ProjectArt({ tone, seed }: { tone: Project["tone"]; seed: number }) {
  const { bg, bars } = TONE_STYLES[tone];
  const barCount = 18;
  const bands = Array.from({ length: barCount }, (_, i) => {
    const t = i / (barCount - 1);
    const wobble = Math.sin(t * Math.PI * 2 + seed) * 0.5 + 0.5;
    const height = 40 + wobble * 140 + Math.sin(seed + t * 7) * 12;
    return { x: (t * 100).toFixed(2), height };
  });

  return (
    <svg viewBox="0 0 400 240" className="block h-full w-full" preserveAspectRatio="xMidYMax slice">
      <rect x="0" y="0" width="400" height="240" fill={bg} />
      {bands.map((band, i) => (
        <rect
          key={i}
          x={`${band.x}%`}
          y={240 - band.height}
          width="3.4%"
          height={band.height}
          fill={bars}
          opacity={0.9}
        />
      ))}
    </svg>
  );
}

function ProjectCard({ project, seed }: { project: Project; seed: number }) {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });

  return (
    <div
      ref={ref}
      className="group overflow-hidden rounded-3xl bg-white transition-transform duration-500"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <div className="aspect-[4/3] w-full overflow-hidden">
        <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-105">
          <ProjectArt tone={project.tone} seed={seed} />
        </div>
      </div>
      <div className="flex items-start justify-between gap-4 px-1 pt-5">
        <div>
          <h3
            className="text-lg font-semibold text-[#14141a]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {project.title}
          </h3>
          <p className="mt-1 text-[13px] text-neutral-500">{project.location}</p>
        </div>
        <span className="mt-1 shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-neutral-600">
          {project.sector}
        </span>
      </div>
    </div>
  );
}

export default function ProjectsGrid() {
  const { ref: headerRef, inView: headerInView } = useInView({ threshold: 0.4, triggerOnce: true });

  return (
    <section className={`${display.variable} w-full bg-[#e6e6ea] px-4 py-20 sm:px-8 md:px-10 md:py-28`}>
      <div className="mx-auto max-w-6xl">
        <div
          ref={headerRef}
          className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end"
          style={{
            opacity: headerInView ? 1 : 0,
            transform: headerInView ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
              Portfolio
            </span>
            <h2
              className="mt-3 max-w-lg text-3xl font-bold leading-tight text-[#14141a] md:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Selected work across six sectors
            </h2>
          </div>
          <p className="max-w-xs text-[15px] leading-relaxed text-neutral-500">
            A sample of the projects we have delivered, from transit
            infrastructure to campus and healthcare facilities.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.title} project={project} seed={i * 1.7} />
          ))}
        </div>
      </div>
    </section>
  );
}
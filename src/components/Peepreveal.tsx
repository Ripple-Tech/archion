"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Space_Grotesk } from "next/font/google";
import { blobPathAt, type BlobConfig } from "@/lib/blob-architectural";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
});

const COPY = {
  eyebrow: "Beyond the drawings",
  heading: "Every render starts as a promise. This is where it becomes a place.",
  body: "Scroll and watch the aperture widen, the same shape our studio uses to prototype form, now framing the finished work in motion.",
};

// Increased scroll distance to slow down the lift animation overall
const WRAPPER_VH = 280; 
const PEEP_SIZE = 300;
const PEEP_RADIUS = 100;

// Quintic easing keeps the reveal pinned longer for an "unveiling" feel
function unveilEase(t: number) {
  return Math.pow(t, 2.8);
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function useWindowSize() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

function useDisplayScale(w: number) {
  if (w >= 1024) return 1;
  if (w >= 640) return 0.85;
  return 0.66;
}

export default function PeepReveal() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState(0);
  const { w } = useWindowSize();
  const displayScale = useDisplayScale(w);

  const { ref: inViewRef, inView } = useInView({ threshold: 0, rootMargin: "0px" });

  const setRefs = (node: HTMLDivElement | null) => {
    wrapperRef.current = node;
    inViewRef(node);
  };

  useEffect(() => {
    if (!inView) return;
    let frameId: number;
    const start = performance.now();
    const tick = (now: number) => {
      setTime((now - start) / 1000);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [inView]);

  useEffect(() => {
    if (!inView) return;
    let frameId: number;
    const measure = () => {
      const el = wrapperRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const scrollable = rect.height - window.innerHeight;
        const p = scrollable > 0 ? -rect.top / scrollable : 0;
        setProgress(clamp01(p));
      }
      frameId = requestAnimationFrame(measure);
    };
    frameId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frameId);
  }, [inView]);

  const config: BlobConfig = { size: PEEP_SIZE, radius: PEEP_RADIUS };
  const path = blobPathAt(time, config);

  // Slower, dramatic lift using unveilEase
  const coverLift = unveilEase(progress) * 105;
  // Smoothly fade out cover opacity near the end of the reveal sequence
  const coverOpacity = 1 - easeInOutCubic(clamp01((progress - 0.70) / 0.30));
  // Allow aperture window to grow slightly more during scroll
  const liftGrow = 1 + 0.35 * easeInOutCubic(clamp01(progress / 0.7));
  const peepScale = displayScale * liftGrow;

  return (
    <section
      ref={setRefs}
      className={`${display.variable} relative w-full bg-[#14141a]`}
      style={{ height: `${WRAPPER_VH}vh` }}
    >
      {/* SVG Clip Definition */}
      <svg className="absolute h-0 w-0 overflow-hidden" aria-hidden="true">
        <defs>
          <clipPath id="peep-blob-clip" clipPathUnits="userSpaceOnUse">
            <path d={path} />
          </clipPath>
        </defs>
      </svg>

      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Full-screen playing video background */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/hero.webm"
          autoPlay
          muted
          loop
          playsInline
        />

        {/* Cover layer that lifts away smoothly */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-10 bg-[#e6e6ea] px-6"
          style={{
            transform: `translateY(-${coverLift}vh)`,
            opacity: coverOpacity,
            pointerEvents: coverOpacity < 0.05 ? "none" : "auto",
          }}
        >
          <div className="flex max-w-xl flex-col items-center gap-5 text-center">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
              {COPY.eyebrow}
            </span>
            <h2
              className="text-2xl font-bold leading-tight text-[#14141a] md:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {COPY.heading}
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-neutral-500">
              {COPY.body}
            </p>
          </div>

          {/* Peep Window Container */}
          <div
            className="relative flex items-center justify-center overflow-hidden"
            style={{
              width: PEEP_SIZE,
              height: PEEP_SIZE,
              transform: `scale(${peepScale})`,
              transformOrigin: "center",
              willChange: "transform",
            }}
          >
            {/* Clipped aperture showing video underneath */}
            <div
              className="absolute inset-0 h-full w-full"
              style={{
                clipPath: "url(#peep-blob-clip)",
                WebkitClipPath: "url(#peep-blob-clip)",
              }}
            >
              <video
                className="h-full w-full object-cover"
                src="/hero.webm"
                autoPlay
                muted
                loop
                playsInline
              />
            </div>

            {/* Contour stroke */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox={`0 0 ${PEEP_SIZE} ${PEEP_SIZE}`}
            >
              <path d={path} fill="none" stroke="#14141a" strokeWidth={2} />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
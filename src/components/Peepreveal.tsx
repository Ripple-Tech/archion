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
  
  heading: "We combine architecture and construction expertise to deliver world-class infrastructure project. From healthcare and education to civic and urban infrastructure, with decade of experience we handle every stage of the process. From design to construction, we handle every stage of the process, up to delivery.",
 };

const WRAPPER_VH = 180;
const PEEP_SIZE = 300;
const PEEP_RADIUS = 100;

function hookEase(t: number) {
  return Math.pow(t, 1.8);
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

  const coverLift = hookEase(progress) * 100;
  const coverOpacity = 1 - easeInOutCubic(clamp01((progress - 0.75) / 0.25));
  const liftGrow = 1 + 0.25 * easeInOutCubic(clamp01(progress / 0.6));
  const peepScale = displayScale * liftGrow;

  // Window height fallback for SSR hydration
  const screenHeight = typeof window !== "undefined" && window.innerHeight ? window.innerHeight : 800;

  return (
    <section
      ref={setRefs}
      className={`${display.variable} relative w-full bg-[#14141a]`}
      style={{ height: `${WRAPPER_VH}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* 1. SINGLE HERO BACKGROUND VIDEO */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/hero.webm"
          autoPlay
          muted
          loop
          playsInline
        />

        {/* 2. COVER LAYER SLIDING UPWARD ON SCROLL */}
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-10 px-6 pointer-events-auto"
          style={{
            transform: `translateY(-${coverLift}vh)`,
            opacity: coverOpacity,
            pointerEvents: coverOpacity < 0.05 ? "none" : "auto",
            willChange: "transform, opacity",
          }}
        >
          {/* MASKED BACKGROUND RECTANGLE (Punches hole directly through #e6e6ea cover) */}
          <svg
            className="absolute inset-0 h-full w-full pointer-events-none"
            preserveAspectRatio="none"
          >
            <defs>
              <mask id="cover-aperture-mask" maskUnits="userSpaceOnUse">
                {/* Opaque white fills the full screen cover */}
                <rect width="100%" height="100%" fill="white" />

                {/* Pure black shape punches a transparent hole in the exact viewport center */}
                <g transform={`translate(${w / 2}, ${screenHeight / 2})`}>
                  <g transform={`scale(${peepScale})`}>
                    <g transform={`translate(-${PEEP_SIZE / 2}, -${PEEP_SIZE / 2})`}>
                      <path d={path} fill="black" />
                    </g>
                  </g>
                </g>
              </mask>
            </defs>

            {/* The cover canvas color */}
            <rect
              width="100%"
              height="100%"
              fill="#e6e6ea"
              mask="url(#cover-aperture-mask)"
            />
          </svg>

          {/* 3. EDITORIAL TYPOGRAPHY */}
          <div className="relative z-20 mb-10 flex max-w-xl flex-col items-center gap-5 text-center">
            
            <p
              className="max-w-sm text-sm font-serif leading-relaxed text-neutral-700"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {COPY.heading}
            </p>
           
          </div>

          {/* Spacer to maintain vertical balance for typography above the cutout */}
          <div
            className="relative mt-4 z-20 pointer-events-none"
            style={{
              width: PEEP_SIZE,
              height: PEEP_SIZE,
              transform: `scale(${peepScale})`,
              transformOrigin: "center",
            }}
          />
        </div>
      </div>
    </section>
  );
}
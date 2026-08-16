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

// how tall the scroll-scrubbed wrapper is, in viewport heights.
// more height means a slower, longer scrub before the reveal completes.
const WRAPPER_VH = 320;

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

function usePeepSize(w: number) {
  if (w >= 1024) return 440;
  if (w >= 640) return 360;
  return 280;
}

export default function PeepReveal() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState(0);
  const { w, h } = useWindowSize();
  const peepSize = usePeepSize(w);
  const peepRadius = peepSize * 0.42;

  const { ref: inViewRef, inView } = useInView({ threshold: 0, rootMargin: "0px" });

  const setRefs = (node: HTMLDivElement | null) => {
    wrapperRef.current = node;
    inViewRef(node);
  };

  // the blob keeps its own morph clock, but only while the section is
  // anywhere near the viewport, so it is not spending frames off-screen.
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

  // scroll-scrub progress, 0 at the top of the wrapper, 1 once it has
  // scrolled through its own extra height. also only runs while in view.
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

  const config: BlobConfig = { size: peepSize, radius: peepRadius };
  const path = blobPathAt(time, config);

  // phase 1, the paragraph clears out early in the scrub
  const textEase = easeInOutCubic(clamp01(progress / 0.32));
  const textOpacity = 1 - textEase;
  const textShift = textEase * -36;

  // phase 2, the aperture opens over the middle of the scrub and finishes
  // well before the wrapper runs out, so the full video holds for a beat
  const openEase = easeInOutCubic(clamp01((progress - 0.28) / 0.6));
  const viewportW = w || 1600;
  const viewportH = h || 900;
  const diagonal = Math.hypot(viewportW, viewportH);
  const maxScale = (diagonal * 1.15) / peepSize;
  const scale = 1 + (maxScale - 1) * openEase;

  // the rim outline fades out as the window grows past being a "frame"
  const ringOpacity = 1 - easeInOutCubic(clamp01((progress - 0.55) / 0.25));

  const videoLeft = -((viewportW - peepSize) / 2);
  const videoTop = -((viewportH - peepSize) / 2);

  return (
    <section
      ref={setRefs}
      className={`${display.variable} relative w-full bg-[#e6e6ea]`}
      style={{ height: `${WRAPPER_VH}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div
          className="absolute left-1/2 top-[30%] flex w-full max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-5 px-6 text-center"
          style={{
            transform: `translate(-50%, calc(-50% + ${textShift}px))`,
            opacity: textOpacity,
            pointerEvents: textOpacity < 0.05 ? "none" : "auto",
          }}
        >
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

        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: peepSize,
            height: peepSize,
            clipPath: `path('${path}')`,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center",
            willChange: "transform",
          }}
        >
          <video
            className="absolute object-cover"
            style={{
              width: viewportW,
              height: viewportH,
              left: videoLeft,
              top: videoTop,
            }}
            src="/hero.webm"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>

        <svg
          className="pointer-events-none absolute left-1/2 top-1/2"
          width={peepSize}
          height={peepSize}
          viewBox={`0 0 ${peepSize} ${peepSize}`}
          style={{
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center",
            opacity: ringOpacity,
          }}
        >
          <path d={path} fill="none" stroke="#14141a" strokeWidth={2} />
        </svg>
      </div>
    </section>
  );
}
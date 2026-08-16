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
// the extra height beyond 100vh is the only part that is actually
// scrollable, so WRAPPER_VH - 100 is roughly how far the user scrolls
// before the cover has fully lifted off.
const WRAPPER_VH = 160;

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
  if (w >= 1024) return 300;
  if (w >= 640) return 260;
  return 200;
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

  // the whole cover, text and peep window together, lifts straight up
  // and off the top of the screen as the user scrolls through the wrapper
  const coverLift = easeInOutCubic(progress) * 100; // vh
  // it also fades out in the last stretch so the edge disappears cleanly
  // rather than hard-cutting off mid-frame
  const coverOpacity = 1 - easeInOutCubic(clamp01((progress - 0.75) / 0.25));

  // the peep window gets a small amount of extra lift-off energy, a subtle
  // grow, so it feels like it is the part actually being "peeled" away
  const peepScale = 1 + 0.2 * easeInOutCubic(clamp01(progress / 0.6));

  const viewportW = w || 1600;
  const viewportH = h || 900;
  const peepVideoLeft = -((viewportW - peepSize) / 2);
  const peepVideoTop = -((viewportH - peepSize) / 2);

  return (
    <section
      ref={setRefs}
      className={`${display.variable} relative w-full bg-[#14141a]`}
      style={{ height: `${WRAPPER_VH}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* the video hero, playing full-bleed for the whole time, whether
            or not the cover above it has lifted yet */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/hero.webm"
          autoPlay
          muted
          loop
          playsInline
        />

        {/* the cover: solid backdrop, paragraph, and the blob peep window,
            all riding together as one layer that lifts off the video */}
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

          <div className="relative" style={{ width: peepSize, height: peepSize }}>
            <div
              className="absolute inset-0"
              style={{
                clipPath: `path('${path}')`,
                transform: `scale(${peepScale})`,
                transformOrigin: "center",
                willChange: "transform",
              }}
            >
              <video
                className="absolute object-cover"
                style={{
                  width: viewportW,
                  height: viewportH,
                  left: peepVideoLeft,
                  top: peepVideoTop,
                }}
                src="/hero.webm"
                autoPlay
                muted
                loop
                playsInline
              />
            </div>
            <svg
              className="pointer-events-none absolute inset-0"
              width={peepSize}
              height={peepSize}
              viewBox={`0 0 ${peepSize} ${peepSize}`}
              style={{ transform: `scale(${peepScale})`, transformOrigin: "center" }}
            >
              <path d={path} fill="none" stroke="#14141a" strokeWidth={2} />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
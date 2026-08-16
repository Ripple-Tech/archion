// lib/blob-architectural.ts
//
// Architecture-flavored morph target: a calm circle rest state, punctuated
// by three "made of small pieces" spectacle beats — 12 squares morphing off
// the circle and tiling into one big square, 8 circles morphing off the
// circle and gathering into a clean loose cluster, and 16 wedges morphing
// off the circle and tiling into one big triangle — plus the trefoil
// (three-lobe) shape from the original design.
//
// --- ARCHITECTURE & DESIGN SYSTEM ---
//
// 1. Cycle & Pacing:
//    Circle -> Square Burst -> Circle Rest -> Circle Burst -> Circle Rest
//    -> Triangle Burst -> Circle Rest -> Trefoil -> Loop.
//    Every spectacle burst is padded with a plain circle rest state before
//    and after, providing visual breathing room and a stable anchor for the
//    next wedge-morph to launch from.
//
// 2. Fragment Counts & Sizing:
//    - Square Burst: 12 small squares (4x3 grid layout when assembled).
//    - Circle Burst: 8 small circles spaced with clear architectural gaps
//      (0.25 radii with a 0.90 spread) for a loose, non-overlapping cluster.
//    - Triangle Burst: 16 small triangles (4-row triangular subdivision).
//
// 3. One Continuous Morphing Path (No Opacity, No Crossfade):
//    Every burst is a single geometric deformation — the same technique the
//    trefoil already uses: one path, continuously reshaped by a blend
//    factor, never two paths cross-dissolving via opacity.
//
//    Each burst fragment is a closed loop of N points. At join = 0, that
//    loop is a "wedge" — a pie slice of the circle: the shared local origin
//    plus samples walking that slice's span of the circle's arc. Lay all of
//    a burst's wedges edge to edge and they reconstruct the circle exactly
//    (pixel-identical, not merely similar), because they ARE an even
//    subdivision of it. At join = 1, that same loop is the fragment's
//    assembled target shape (a grid square, a packed circle, a tiled
//    triangle), boundary-sampled to the same point count N. `join` lerps
//    every point straight from its wedge position to its target position —
//    one path, continuously reshaped, exactly like the trefoil's `tie`.
//
//    Nothing fades in, nothing fades out. The circle IS the unexploded view
//    of the very same N-vertex loops that later become the fragments.
//
// 4. Overlap & Evenodd Prevention:
//    Packed circles use a Golden-Angle (Phyllotaxis) distribution sorted by
//    angle-around-center. Wedges are generated in ascending angle order by
//    construction (wedge i spans angle [i/N, (i+1)/N) * tau), so pairing
//    wedge i with target i keeps both matched by direction, giving straight,
//    short paths without fragments crossing over one another mid-transition
//    ("fighting"). Non-overlapping target gaps plus consistent wedge winding
//    prevent evenodd/nonzero clipping cancellation artifacts.
//
// 5. Continuous Global Rotation:
//    A single continuous 360-degree rotation (`spin`) spans the full loop
//    duration, unifying all phases under a single persistent physical
//    system.

const TAU = Math.PI * 2;

export type BlobConfig = {
  size?: number;
  radius?: number;
  samples?: number;
};

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function wobble(t: number, cycle: number) {
  const a = TAU * cycle;
  return 0.024 * Math.sin(3 * t + 3 * a) + 0.016 * Math.sin(5 * t - 2 * a);
}

export const PHASES = [
  { id: "circle", label: "Circle", dur: 1.2 },

  // --- 12 Small Squares ---
  { id: "toSquareBurst", label: "Fragmenting", dur: 1.6 },
  { id: "squareBurstHold", label: "Square Tiling", dur: 3.6 },
  { id: "fromSquareBurst", label: "Coalescing", dur: 1.6 },

  { id: "circleRestA", label: "Circle", dur: 0.8 },

  // --- 8 Small Circles ---
  { id: "toCircleBurst", label: "Gathering", dur: 1.6 },
  { id: "circleBurstHold", label: "Cluster Gathering", dur: 3.6 },
  { id: "fromCircleBurst", label: "Coalescing", dur: 1.6 },

  { id: "circleRestB", label: "Circle", dur: 0.8 },

  // --- 16 Small Triangles ---
  { id: "toTriangleBurst", label: "Fragmenting", dur: 1.6 },
  { id: "triangleBurstHold", label: "Triangle Tiling", dur: 3.6 },
  { id: "fromTriangleBurst", label: "Coalescing", dur: 1.6 },

  { id: "circleRestC", label: "Circle", dur: 0.8 },

  { id: "toTrefoil", label: "Rolling into three", dur: 1.6 },
  { id: "trefoilHold", label: "Tied", dur: 1.5 },
  { id: "fromTrefoil", label: "Untying", dur: 1.2 },
];

export const LOOP = PHASES.reduce((s, p) => s + p.dur, 0);

export function phaseAt(time: number): { id: string; label: string; p: number } {
  const t = ((time % LOOP) + LOOP) % LOOP;
  let acc = 0;
  for (let i = 0; i < PHASES.length; i++) {
    const ph = PHASES[i];
    if (t < acc + ph.dur || i === PHASES.length - 1) {
      return {
        id: ph.id,
        label: ph.label,
        p: clamp((t - acc) / ph.dur, 0, 1),
      };
    }
    acc += ph.dur;
  }
  return { id: "circle", label: "Circle", p: 0 };
}

type Target = { sides: number; rotation: number };

type Fragment = { x: number; y: number; size: number; rot: number };

function squareGridLayout(cols: number, rows: number, bigSide: number, gapFrac: number): Fragment[] {
  const cellW = bigSide / cols;
  const cellH = bigSide / rows;
  const half = (Math.min(cellW, cellH) / 2) * (1 - gapFrac);
  const frags: Fragment[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      frags.push({
        x: -bigSide / 2 + cellW * (c + 0.5),
        y: -bigSide / 2 + cellH * (r + 0.5),
        size: half,
        rot: 0,
      });
    }
  }
  return frags;
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function phyllotaxisLayout(count: number, spread: number, itemSize: number): Fragment[] {
  const raw: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i++) {
    const a = i * GOLDEN_ANGLE;
    const rNorm = Math.sqrt((i + 0.5) / count);
    raw.push({ x: Math.cos(a) * rNorm * spread, y: Math.sin(a) * rNorm * spread });
  }
  raw.sort((p, q) => Math.atan2(p.y, p.x) - Math.atan2(q.y, q.x));
  return raw.map((p) => ({ x: p.x, y: p.y, size: itemSize, rot: 0 }));
}

const TRI_UNIT: Array<[number, number]> = [
  [Math.cos(-Math.PI / 2), Math.sin(-Math.PI / 2)],
  [Math.cos(-Math.PI / 2 + TAU / 3), Math.sin(-Math.PI / 2 + TAU / 3)],
  [Math.cos(-Math.PI / 2 - TAU / 3), Math.sin(-Math.PI / 2 - TAU / 3)],
];
const [TRI_A, TRI_B, TRI_C] = TRI_UNIT.map(([x, y]) => ({ x, y }));

function triGridPoint(r: number, c: number, n: number) {
  const wA = (n - r) / n;
  const wB = (r - c) / n;
  const wC = c / n;
  return {
    x: wA * TRI_A.x + wB * TRI_B.x + wC * TRI_C.x,
    y: wA * TRI_A.y + wB * TRI_B.y + wC * TRI_C.y,
  };
}

function triangleGridLayout(n: number): Fragment[] {
  const frags: Fragment[] = [];
  const size = 1 / n;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c <= r; c++) {
      const p1 = triGridPoint(r, c, n);
      const p2 = triGridPoint(r + 1, c, n);
      const p3 = triGridPoint(r + 1, c + 1, n);
      frags.push({
        x: (p1.x + p2.x + p3.x) / 3,
        y: (p1.y + p2.y + p3.y) / 3,
        size,
        rot: 0,
      });
      if (c < r) {
        const q1 = triGridPoint(r, c, n);
        const q2 = triGridPoint(r + 1, c + 1, n);
        const q3 = triGridPoint(r + 1, c + 1, n);
        frags.push({
          x: (q1.x + q2.x + q3.x) / 3,
          y: (q1.y + q2.y + q3.y) / 3,
          size,
          rot: Math.PI,
        });
      }
    }
  }
  return frags;
}

// Fragment layout settings
const SQUARE_COLS = 4;
const SQUARE_ROWS = 3;
const SQUARE_BIG_SIDE = Math.SQRT2;
const SQUARE_GRID_GAP = 0.16;

// Small circle cluster parameters: 8 elements with spatial breathing room
const CIRCLE_COUNT = 8;
const CIRCLE_PACK_SPREAD = 0.90;    // Adjusted spread for 8 larger circles
const CIRCLE_PACK_R = 0.25;         // Radius creates a 0.30 diameter, leaving clear gaps between centers

const TRIANGLE_N = 4;

// Vertices per fragment loop. Kept a multiple of the target polygon's edge
// count so target corners always land on exact vertices (no rounding), and
// high enough on the circle-cluster burst that the packed circles still
// read as true circles once assembled.
const SQUARE_FRAG_SAMPLES = 12; // 3 per edge x 4 edges
const TRIANGLE_FRAG_SAMPLES = 12; // 4 per edge x 3 edges
const CIRCLE_FRAG_SAMPLES = 24;

function blobState(time: number) {
  const T = ((time % LOOP) + LOOP) % LOOP;
  const ph = phaseAt(T);
  const p = ph.p;
  const cycle = T / LOOP;

  const spin = TAU * cycle;

  let mode: "polygon" | "trefoil" | "squareBurst" | "circleBurst" | "triangleBurst" = "polygon";
  let sharp = 0;
  let target: Target = { sides: 4, rotation: Math.PI / 4 };
  let scale = 1;

  let tie = 0;
  const organic = 0.25;
  let join = 0;

  switch (ph.id) {
    case "circle":
      sharp = 0;
      break;

    case "toSquareBurst":
      mode = "squareBurst";
      join = easeInOut(p);
      scale = mix(1, 1.05, easeInOut(p));
      break;
    case "squareBurstHold":
      mode = "squareBurst";
      join = 1;
      scale = 1.05 + 0.012 * Math.sin(p * Math.PI * 2);
      break;
    case "fromSquareBurst":
      mode = "squareBurst";
      join = 1 - easeInOut(p);
      scale = mix(1.05, 1, easeInOut(p));
      break;

    case "toCircleBurst":
      mode = "circleBurst";
      join = easeInOut(p);
      scale = mix(1, 1.04, easeInOut(p));
      break;
    case "circleBurstHold":
      mode = "circleBurst";
      join = 1;
      scale = 1.04 + 0.01 * Math.sin(p * Math.PI * 2);
      break;
    case "fromCircleBurst":
      mode = "circleBurst";
      join = 1 - easeInOut(p);
      scale = mix(1.04, 1, easeInOut(p));
      break;

    case "toTriangleBurst":
      mode = "triangleBurst";
      join = easeInOut(p);
      scale = mix(1, 1.05, easeInOut(p));
      break;
    case "triangleBurstHold":
      mode = "triangleBurst";
      join = 1;
      scale = 1.05 + 0.012 * Math.sin(p * Math.PI * 2);
      break;
    case "fromTriangleBurst":
      mode = "triangleBurst";
      join = 1 - easeInOut(p);
      scale = mix(1.05, 1, easeInOut(p));
      break;

    case "toTrefoil":
      mode = "trefoil";
      tie = easeInOut(p);
      scale = mix(1, 1.06, easeInOut(p));
      break;
    case "trefoilHold":
      mode = "trefoil";
      tie = 1;
      scale = 1.06 + 0.015 * Math.sin(p * Math.PI * 2);
      break;
    case "fromTrefoil":
      mode = "trefoil";
      tie = 1 - easeInOut(p);
      scale = mix(1.06, 1, easeInOut(p));
      break;
  }

  return { mode, sharp, target, scale, spin, tie, organic, cycle, join };
}

export function samplePoints(time: number, opts?: BlobConfig) {
  const samples = opts?.samples || 96;
  const size = opts?.size || 400;
  const radius = opts?.radius || 184;

  const st = blobState(time);
  const cx = size / 2;
  const cy = size / 2;
  const cs = Math.cos(st.spin);
  const sn = Math.sin(st.spin);

  const w = st.tie;
  const norm = 1 / (1 + 2 * w);
  const wind = -TAU * 6 * st.cycle;

  const pts = new Array(samples);
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * TAU;

    let x: number;
    let y: number;

    if (st.mode === "trefoil") {
      const f = 1 + wobble(t, st.cycle) * st.organic;
      x = Math.cos(t) * f;
      y = Math.sin(t) * f;

      if (w > 1e-4) {
        const a = -2 * t + wind;
        x = (x + 2 * w * Math.cos(a)) * norm;
        y = (y + 2 * w * Math.sin(a)) * norm;
      }
    } else {
      x = Math.cos(t);
      y = Math.sin(t);
    }

    const r = radius * st.scale;
    pts[i] = {
      x: cx + (x * cs - y * sn) * r,
      y: cy + (x * sn + y * cs) * r,
    };
  }
  return pts;
}

function catmullRomPath(pts: Array<{ x: number; y: number }>): string {
  const n = pts.length;
  let d = "M" + pts[0].x.toFixed(1) + " " + pts[0].y.toFixed(1);

  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    d +=
      "C" +
      c1x.toFixed(1) + " " + c1y.toFixed(1) + " " +
      c2x.toFixed(1) + " " + c2y.toFixed(1) + " " +
      p2.x.toFixed(1) + " " + p2.y.toFixed(1);
  }
  return d + "Z";
}

function worldPoint(lx: number, ly: number, cs: number, sn: number, R: number, ccx: number, ccy: number) {
  return {
    x: ccx + (lx * cs - ly * sn) * R,
    y: ccy + (lx * sn + ly * cs) * R,
  };
}

type Pt = { x: number; y: number };

function lerpPt(a: Pt, b: Pt, t: number): Pt {
  return { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) };
}

// One pie-slice ("wedge") of the unit circle: the shared local origin,
// followed by `count - 1` samples walking that slice's span of the arc.
// Lay every wedge of a burst down together and their union is the plain
// circle, exactly — this is the join = 0 end of the morph, not a stand-in
// for it.
function wedgeLocalPoints(index: number, total: number, count: number): Pt[] {
  const a0 = (index / total) * TAU;
  const a1 = ((index + 1) / total) * TAU;
  const arcSamples = count - 1;
  const pts: Pt[] = [{ x: 0, y: 0 }];
  for (let j = 0; j < arcSamples; j++) {
    const a = mix(a0, a1, j / Math.max(1, arcSamples - 1));
    pts.push({ x: Math.cos(a), y: Math.sin(a) });
  }
  return pts;
}

// Perimeter of an axis-aligned square, centered on its own local origin,
// walked edge by edge so corners always land on exact vertices.
function squareLocalPoints(half: number, rot: number, count: number): Pt[] {
  const perEdge = count / 4;
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const corners: Pt[] = [
    { x: -half, y: -half },
    { x: half, y: -half },
    { x: half, y: half },
    { x: -half, y: half },
  ];
  const pts: Pt[] = [];
  for (let e = 0; e < 4; e++) {
    const p0 = corners[e];
    const p1 = corners[(e + 1) % 4];
    for (let j = 0; j < perEdge; j++) {
      const t = j / perEdge;
      const lx = mix(p0.x, p1.x, t);
      const ly = mix(p0.y, p1.y, t);
      pts.push({ x: lx * c - ly * s, y: lx * s + ly * c });
    }
  }
  return pts;
}

// Perimeter of the small tiling triangle (same TRI_UNIT direction set the
// trefoil and triangleGridLayout use), walked edge by edge for crisp
// corners.
function triangleLocalPoints(size: number, rot: number, count: number): Pt[] {
  const perEdge = count / 3;
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const corners: Pt[] = TRI_UNIT.map(([x, y]) => ({ x: x * size, y: y * size }));
  const pts: Pt[] = [];
  for (let e = 0; e < 3; e++) {
    const p0 = corners[e];
    const p1 = corners[(e + 1) % 3];
    for (let j = 0; j < perEdge; j++) {
      const t = j / perEdge;
      const lx = mix(p0.x, p1.x, t);
      const ly = mix(p0.y, p1.y, t);
      pts.push({ x: lx * c - ly * s, y: lx * s + ly * c });
    }
  }
  return pts;
}

// Circumference of a small circle fragment, evenly sampled by angle.
function circleLocalPoints(r: number, count: number): Pt[] {
  const pts: Pt[] = [];
  for (let j = 0; j < count; j++) {
    const a = (j / count) * TAU;
    pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }
  return pts;
}

// Every burst fragment as an N-point loop, lerped straight from its wedge
// (join = 0) to its assembled target shape (join = 1). Same loop, same
// point count, both ends — this is what makes it one continuous morph
// instead of two things trading places via opacity.
function burstFragmentLoops(
  mode: "squareBurst" | "circleBurst" | "triangleBurst",
  join: number
): Pt[][] {
  let targets: Fragment[];
  let samples: number;
  let targetPoints: (f: Fragment) => Pt[];

  if (mode === "squareBurst") {
    targets = squareGridLayout(SQUARE_COLS, SQUARE_ROWS, SQUARE_BIG_SIDE, SQUARE_GRID_GAP);
    samples = SQUARE_FRAG_SAMPLES;
    targetPoints = (f) => squareLocalPoints(f.size, f.rot, samples);
  } else if (mode === "circleBurst") {
    targets = phyllotaxisLayout(CIRCLE_COUNT, CIRCLE_PACK_SPREAD, CIRCLE_PACK_R);
    samples = CIRCLE_FRAG_SAMPLES;
    targetPoints = (f) => circleLocalPoints(f.size, samples);
  } else {
    targets = triangleGridLayout(TRIANGLE_N);
    samples = TRIANGLE_FRAG_SAMPLES;
    targetPoints = (f) => triangleLocalPoints(f.size, f.rot, samples);
  }

  const total = targets.length;
  return targets.map((f, i) => {
    const wedge = wedgeLocalPoints(i, total, samples);
    const target = targetPoints(f);
    return wedge.map((wp, j) => {
      const tp = { x: target[j].x + f.x, y: target[j].y + f.y };
      return lerpPt(wp, tp, join);
    });
  });
}

function loopsToPath(loops: Pt[][], spin: number, R: number, ccx: number, ccy: number): string {
  const cs = Math.cos(spin);
  const sn = Math.sin(spin);
  let d = "";
  for (const loop of loops) {
    for (let i = 0; i < loop.length; i++) {
      const wp = worldPoint(loop[i].x, loop[i].y, cs, sn, R, ccx, ccy);
      d += (i === 0 ? "M" : "L") + wp.x.toFixed(1) + " " + wp.y.toFixed(1);
    }
    d += "Z";
  }
  return d;
}

// The single, continuous morphing path for the current instant: the
// circle/trefoil spline outside of bursts, or the wedge<->shape loops
// during a burst. Always one path, always fully opaque — there is nothing
// to crossfade.
export function blobPathAt(time: number, opts?: BlobConfig): string {
  const size = opts?.size || 400;
  const radius = opts?.radius || 184;
  const st = blobState(time);

  if (st.mode === "squareBurst" || st.mode === "circleBurst" || st.mode === "triangleBurst") {
    const ccx = size / 2;
    const ccy = size / 2;
    const R = radius * st.scale;
    const loops = burstFragmentLoops(st.mode, st.join);
    return loopsToPath(loops, st.spin, R, ccx, ccy);
  }

  return catmullRomPath(samplePoints(time, opts));
}
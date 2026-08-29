/**
 * Four-corner print areas and the perspective transform that maps a flat
 * design onto one.
 *
 * A quad is the print area as the admin drew it on a garment photo: four
 * corners, top-left → top-right → bottom-right → bottom-left, each in percent
 * of the photo's width and height. Percentages keep it valid at any rendered
 * size; the pixel matrix is computed on the client once the box is measured.
 *
 * The projective maths is the classic "map a rectangle to four points" used
 * by every CSS mockup tool: build the 3×3 homography from the unit basis to
 * each quad, then compose one with the inverse (adjugate) of the other.
 */

export type Point = [number, number];
/** TL, TR, BR, BL. */
export type Quad = [Point, Point, Point, Point];

export const DEFAULT_QUAD: Quad = [
  [34, 30],
  [66, 30],
  [66, 62],
  [34, 62],
];

const isPoint = (v: unknown): v is Point =>
  Array.isArray(v) && v.length === 2 && v.every((n) => Number.isFinite(Number(n)));

export function cleanQuad(input: unknown): Quad {
  if (!Array.isArray(input) || input.length !== 4 || !input.every(isPoint)) {
    return DEFAULT_QUAD;
  }
  const clamp = (n: number) => Math.max(-50, Math.min(150, Math.round(n * 100) / 100));
  return input.map(([x, y]) => [clamp(Number(x)), clamp(Number(y))]) as Quad;
}

export function quadCenter(q: Quad): Point {
  return [
    (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4,
    (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4,
  ];
}

/* --------------------------- 3×3 matrix helpers --------------------------- */

type M3 = number[]; // row-major, 9 entries

function adjugate(m: M3): M3 {
  return [
    m[4] * m[8] - m[5] * m[7],
    m[2] * m[7] - m[1] * m[8],
    m[1] * m[5] - m[2] * m[4],
    m[5] * m[6] - m[3] * m[8],
    m[0] * m[8] - m[2] * m[6],
    m[2] * m[3] - m[0] * m[5],
    m[3] * m[7] - m[4] * m[6],
    m[1] * m[6] - m[0] * m[7],
    m[0] * m[4] - m[1] * m[3],
  ];
}

function multiply(a: M3, b: M3): M3 {
  const c = new Array<number>(9);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let s = 0;
      for (let k = 0; k < 3; k++) s += a[3 * i + k] * b[3 * k + j];
      c[3 * i + j] = s;
    }
  }
  return c;
}

function multiplyVec(m: M3, v: number[]): number[] {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}

/** The homography taking the projective basis to four points. */
function basisToPoints([p1, p2, p3, p4]: Quad): M3 {
  const m: M3 = [p1[0], p2[0], p3[0], p1[1], p2[1], p3[1], 1, 1, 1];
  const v = multiplyVec(adjugate(m), [p4[0], p4[1], 1]);
  return multiply(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]);
}

/** Row-major 3×3 mapping `src` corners onto `dst` corners (same order). */
export function projectiveTransform(src: Quad, dst: Quad): M3 {
  const s = basisToPoints(src);
  const d = basisToPoints(dst);
  const t = multiply(d, adjugate(s));
  return t.map((n) => n / t[8]);
}

/**
 * A CSS `matrix3d(...)` that carries a `w`×`h` element whose transform-origin
 * is `0 0` onto `dst` (in the same pixel space). Corner order is TL, TR, BR,
 * BL, matching the element's own corners.
 */
export function matrix3d(w: number, h: number, dst: Quad): string {
  const src: Quad = [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ];
  const t = projectiveTransform(src, dst);
  // Column-major, with the 3×3 spread across the x, y and w rows of the 4×4.
  const m = [t[0], t[3], 0, t[6], t[1], t[4], 0, t[7], 0, 0, 1, 0, t[2], t[5], 0, t[8]];
  return `matrix3d(${m.map((n) => (Number.isFinite(n) ? n.toFixed(6) : 0)).join(",")})`;
}

/** Side lengths of the quad's top and left edges — the un-warped print size. */
export function quadSize(q: Quad): { w: number; h: number } {
  const d = (a: Point, b: Point) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  return { w: Math.max(1, d(q[0], q[1])), h: Math.max(1, d(q[0], q[3])) };
}

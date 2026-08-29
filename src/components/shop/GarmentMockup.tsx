import { useId } from "react";

/**
 * A T-shirt or cap, drawn in SVG, in any colour, from five angles, with a
 * design printed on it.
 *
 * Every mockup on the store is this one component: the shop grid, the product
 * page's angle picker, the admin's live preview and the basket thumbnail. The
 * garment is pure vector — no photographs, no 3D models — so recolouring is a
 * fill change, the design is an <image> clipped to the print area, and the
 * whole thing renders on the server as easily as in the browser.
 *
 * It is drawn to read like a product render rather than a diagram — the
 * ghost-mannequin style of a catalogue mockup: a garment floating over a soft
 * studio backdrop, lit from the front, with blurred shadows for form, an
 * occluded rim so the edges have depth, folds as soft troughs with lit ridges,
 * a ribbed collar with the label showing through the neck, and the print
 * displaced a little so it follows the cloth. Every tone is a translucent
 * black or white overlay, so the same drawing works on white, black and
 * everything between.
 *
 * `quality="lite"` drops the displacement filter for the many small copies
 * on a grid; everything else is cheap enough to keep everywhere.
 *
 * Deliberately dependency-free (only React) so it can be rendered outside the
 * app — the preview harness used to draw it does exactly that.
 */

export type GarmentCategory = "tshirt" | "cap";
export type GarmentView = "front" | "back" | "left" | "right" | "side" | "detail" | "top";

export type GarmentMockupProps = {
  category: GarmentCategory;
  view: GarmentView;
  /** Base fabric colour, as a hex string. */
  color: string;
  /** URL of the artwork to print. Null shows the print area as a placeholder. */
  design: string | null;
  className?: string;
  /** Accessible name; omit to mark the graphic decorative. */
  title?: string;
  /** "lite" skips the fabric-displacement filter — for thumbnails and grids. */
  quality?: "full" | "lite";
  /** Paint the studio backdrop. Off for a transparent cut-out. */
  backdrop?: boolean;
  /** Nudge (percent of the print area's height, down is positive) and size. */
  print?: { offsetY?: number; scale?: number };
};

export const VIEW_BOX = "0 0 400 480";

/* --------------------------------- Colour -------------------------------- */

type Palette = {
  base: string;
  dark: boolean;
  /** Multipliers so shading survives on both very dark and very light bases. */
  shadowK: number;
  lightK: number;
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  if (Number.isNaN(n)) return [128, 128, 128];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function palette(hex: string): Palette {
  const lum = luminance(hex);
  const dark = lum < 0.18;
  const light = lum > 0.7;
  return {
    base: hex,
    dark,
    // On black, black shadows vanish — lean on highlights instead. On white
    // the reverse: highlights vanish, so shadows carry the form.
    shadowK: dark ? 0.55 : light ? 1.1 : 1,
    lightK: dark ? 2.1 : light ? 0.55 : 1,
  };
}

/* ------------------------------- Primitives ------------------------------- */

type Ids = {
  body: string;
  print: string;
  visor: string;
  crown: string;
  sleeve: string;
  soft: string;
  softer: string;
  blur3: string;
  wrinkle: string;
  rib: string;
  backdrop: string;
  glow: string;
};

type ToneProps = {
  d: string;
  k?: number;
  p: Palette;
  stroke?: boolean;
  width?: number;
  filter?: string;
};

function Shade({ d, k = 0.1, p, stroke, width, filter }: ToneProps) {
  const opacity = Math.min(1, k * p.shadowK);
  const f = filter ? `url(#${filter})` : undefined;
  return stroke ? (
    <path d={d} fill="none" stroke="#000" strokeOpacity={opacity} strokeWidth={width ?? 1.2} strokeLinecap="round" filter={f} />
  ) : (
    <path d={d} fill="#000" fillOpacity={opacity} filter={f} />
  );
}

function Light({ d, k = 0.1, p, stroke, width, filter }: ToneProps) {
  const opacity = Math.min(1, k * p.lightK);
  const f = filter ? `url(#${filter})` : undefined;
  return stroke ? (
    <path d={d} fill="none" stroke="#fff" strokeOpacity={opacity} strokeWidth={width ?? 1.2} strokeLinecap="round" filter={f} />
  ) : (
    <path d={d} fill="#fff" fillOpacity={opacity} filter={f} />
  );
}

/** A blurred ellipse of shadow or light — the workhorse of the soft shading. */
function Blob({
  cx,
  cy,
  rx,
  ry,
  rotate = 0,
  k,
  p,
  light = false,
  filter,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotate?: number;
  k: number;
  p: Palette;
  light?: boolean;
  filter: string;
}) {
  const opacity = Math.min(1, k * (light ? p.lightK : p.shadowK));
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      transform={rotate ? `rotate(${rotate} ${cx} ${cy})` : undefined}
      fill={light ? "#fff" : "#000"}
      fillOpacity={opacity}
      filter={`url(#${filter})`}
    />
  );
}

/**
 * The artwork, clipped to the print area. `transform` is how the angled views
 * foreshorten it; `filter` ripples it with the cloth. When mirrored, the image
 * is flipped back on itself so the placement mirrors but the artwork does not.
 */
function Print({
  design,
  x,
  y,
  w,
  h,
  align = "xMidYMin",
  transform,
  clip,
  filter,
  mirrored = false,
  offsetY = 0,
  scale = 1,
  p,
}: {
  design: string | null;
  x: number;
  y: number;
  w: number;
  h: number;
  align?: string;
  transform?: string;
  clip: string;
  filter?: string;
  mirrored?: boolean;
  offsetY?: number;
  scale?: number;
  p: Palette;
}) {
  const unmirror = mirrored ? `translate(${x * 2 + w} 0) scale(-1 1)` : undefined;
  // The admin's placement: slide the print, then size it about its anchor —
  // the top edge when the print hangs from the chest, the centre otherwise.
  const ax = x + w / 2;
  const ay = align === "xMidYMin" ? y : y + h / 2;
  const placement =
    offsetY || scale !== 1
      ? `translate(0 ${(offsetY / 100) * h}) translate(${ax} ${ay}) scale(${scale}) translate(${-ax} ${-ay})`
      : undefined;
  // The clip wraps the transform rather than sharing an element with it: a
  // clip-path on a transformed element is evaluated in that element's own
  // (transformed) space, which would shrink the print area along with the art.
  return (
    <g clipPath={`url(#${clip})`}>
      <g transform={transform} filter={filter ? `url(#${filter})` : undefined}>
      <g transform={placement}>
        {design ? (
          <image
            href={design}
            x={x}
            y={y}
            width={w}
            height={h}
            preserveAspectRatio={`${align} meet`}
            transform={unmirror}
            opacity={0.96}
          />
        ) : (
          <g transform={unmirror}>
            <rect
              x={x + 4}
              y={y + 4}
              width={w - 8}
              height={h - 8}
              fill="none"
              stroke={p.dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.28)"}
              strokeWidth={1.5}
              strokeDasharray="6 5"
            />
            <text
              x={x + w / 2}
              y={y + h / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="system-ui, sans-serif"
              fontSize={13}
              letterSpacing={2}
              fill={p.dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.4)"}
            >
              YOUR DESIGN
            </text>
          </g>
        )}
      </g>
      </g>
    </g>
  );
}

/* --------------------------------- T-shirt -------------------------------- */

/**
 * A ghost-mannequin silhouette: rounded shoulders, sleeves hanging outward,
 * a soft waist, a gently curved hem. Symmetric about x=200, closed across a
 * shallow front neckline.
 */
const TEE_BODY =
  "M152 88 C130 92 106 100 88 112 C72 136 54 166 40 196 Q64 218 88 214 " +
  "C98 200 104 188 106 178 C102 240 98 340 102 442 Q200 456 298 442 " +
  "C302 340 298 240 294 178 C296 188 302 200 312 214 Q336 218 360 196 " +
  "C346 166 328 136 312 112 C294 100 270 92 248 88 Q200 122 152 88 Z";

/** Same body; from behind the collar sits just above the shoulder line. */
const TEE_BODY_BACK =
  "M152 88 C130 92 106 100 88 112 C72 136 54 166 40 196 Q64 218 88 214 " +
  "C98 200 104 188 106 178 C102 240 98 340 102 442 Q200 456 298 442 " +
  "C302 340 298 240 294 178 C296 188 302 200 312 214 Q336 218 360 196 " +
  "C346 166 328 136 312 112 C294 100 270 92 248 88 Q200 78 152 88 Z";

/**
 * Turned roughly 35°, its right side toward the viewer: the near sleeve is
 * large on the left, the far sleeve peeps out on the right, and the front —
 * with the print — faces the viewer's right.
 */
const TEE_BODY_TURN =
  "M168 90 C142 94 114 102 96 114 C78 142 58 170 46 198 Q68 216 94 214 " +
  "C102 206 108 192 112 180 C106 240 104 330 110 442 Q200 454 290 444 " +
  "C292 330 292 240 286 180 C292 190 296 200 300 208 Q318 212 330 196 " +
  "C326 170 324 142 312 114 C292 100 270 90 248 84 Q212 126 168 90 Z";

/**
 * In profile, facing left: the near sleeve points at the viewer and hides
 * the top of the torso, which continues narrowly beneath it to the hem.
 */
const TEE_SIDE_TORSO =
  "M180 94 C162 150 154 230 156 300 C157 360 152 410 156 444 Q204 452 250 444 " +
  "C252 400 250 340 250 300 C250 230 248 150 232 90 Z";
const TEE_SIDE_SLEEVE =
  "M184 92 C164 100 150 122 146 150 C142 178 144 202 152 218 Q206 238 258 216 " +
  "C266 200 266 168 260 140 C254 114 244 98 232 88 Q206 82 184 92 Z";

const TEE_PRINT = { x: 124, y: 150, w: 152, h: 180 };

/** The soft pool of shadow a floating garment leaves on the backdrop. */
function FloorShadow({ ids, cx = 200, cy = 466, rx = 118 }: { ids: Ids; cx?: number; cy?: number; rx?: number }) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={rx * 1.25} ry={14} fill="#000" fillOpacity={0.1} filter={`url(#${ids.softer})`} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={9} fill="#000" fillOpacity={0.26} filter={`url(#${ids.soft})`} />
    </>
  );
}

/** A sleeve hem: the seam where the cuff turns, lit on the fold. */
function Cuff({ d, p }: { d: string; p: Palette }) {
  return (
    <>
      <Shade d={d} k={0.12} p={p} stroke width={1.1} />
      <Light d={d} k={0.24} p={p} stroke width={1} />
    </>
  );
}

/** Everything that makes the cloth read as cloth: rim, form and folds. */
function TeeForm({ p, ids, body, turn }: { p: Palette; ids: Ids; body: string; turn: boolean }) {
  // x-offset for the turned view's shapes; the far side is a little tighter.
  const t = turn ? 6 : 0;
  return (
    <g clipPath={`url(#${ids.body})`}>
      {/* Occluded rim: a fat blurred stroke straddling the edge. */}
      <path d={body} fill="none" stroke="#000" strokeOpacity={0.11 * p.shadowK} strokeWidth={20} filter={`url(#${ids.soft})`} />

      {/* Broad form — lit from the front, falling off toward both seams. */}
      <rect x={0} y={0} width={400} height={480} fill={`url(#${ids.glow})`} />
      <Blob cx={106 + t} cy={310} rx={26} ry={150} k={0.12} p={p} filter={ids.softer} />
      <Blob cx={turn ? 288 : 294} cy={310} rx={turn ? 40 : 30} ry={150} k={turn ? 0.24 : 0.17} p={p} filter={ids.softer} />
      <Blob cx={200 + t} cy={370} rx={90} ry={22} k={0.05} p={p} filter={ids.softer} />
      <Blob cx={200 + t} cy={438} rx={100} ry={9} k={0.12} p={p} filter={ids.soft} />

      {/* The collar throws a crescent of shadow onto the chest. */}
      <Shade
        d={turn ? "M176 98 Q212 148 244 94 Q214 168 176 98 Z" : "M160 96 Q200 146 240 96 Q200 166 160 96 Z"}
        k={0.16}
        p={p}
        filter={ids.soft}
      />

      {/* Armpits. */}
      <Blob cx={112 + t} cy={188} rx={14} ry={26} k={0.16} p={p} filter={ids.soft} />
      <Blob cx={turn ? 286 : 288} cy={188} rx={14} ry={26} k={turn ? 0.2 : 0.16} p={p} filter={ids.soft} />

      {/* Sleeves: dark on the underside toward the body, bright along the top. */}
      <Blob cx={98 + t} cy={196} rx={14} ry={40} rotate={-32} k={0.16} p={p} filter={ids.soft} />
      <Blob cx={56 + t} cy={192} rx={16} ry={24} rotate={-32} k={0.07} p={p} filter={ids.soft} />
      <Blob cx={74 + t} cy={142} rx={12} ry={34} rotate={-34} k={turn ? 0.14 : 0.2} p={p} light filter={ids.soft} />
      {turn ? (
        <Blob cx={302} cy={170} rx={12} ry={40} rotate={16} k={0.2} p={p} filter={ids.soft} />
      ) : (
        <>
          <Blob cx={302} cy={196} rx={14} ry={40} rotate={32} k={0.18} p={p} filter={ids.soft} />
          <Blob cx={344} cy={192} rx={16} ry={24} rotate={32} k={0.08} p={p} filter={ids.soft} />
          <Blob cx={326} cy={142} rx={12} ry={34} rotate={34} k={0.12} p={p} light filter={ids.soft} />
        </>
      )}

      {/* Shoulders catch the light. */}
      <Light d={turn ? "M106 114 Q138 98 168 92" : "M98 112 Q130 96 152 90"} k={0.26} p={p} stroke width={5} filter={ids.blur3} />
      <Light d={turn ? "M304 114 Q276 96 248 86" : "M302 112 Q270 96 248 90"} k={turn ? 0.1 : 0.18} p={p} stroke width={5} filter={ids.blur3} />

      {/* Folds: a soft dark trough with a lit ridge beside it. */}
      <Shade d={`M${120 + t} 196 C${126 + t} 260 ${118 + t} 340 ${114 + t} 432`} k={0.14} p={p} stroke width={8} filter={ids.blur3} />
      <Light d={`M${130 + t} 196 C${136 + t} 260 ${128 + t} 340 ${124 + t} 432`} k={0.16} p={p} stroke width={3} filter={ids.blur3} />
      <Shade d={`M${152 + t} 262 C${158 + t} 320 ${152 + t} 380 ${146 + t} 440`} k={0.07} p={p} stroke width={7} filter={ids.blur3} />
      <Light d={`M${160 + t} 262 C${166 + t} 320 ${160 + t} 380 ${154 + t} 440`} k={0.12} p={p} stroke width={3} filter={ids.blur3} />
      <Shade d={turn ? "M278 196 C272 260 280 340 284 432" : "M280 196 C274 260 282 340 286 432"} k={0.17} p={p} stroke width={8} filter={ids.blur3} />
      <Light d={turn ? "M268 196 C262 260 270 340 274 432" : "M270 196 C264 260 272 340 276 432"} k={0.12} p={p} stroke width={3} filter={ids.blur3} />
      <Shade d={turn ? "M252 262 C246 320 252 380 258 440" : "M250 262 C244 320 250 380 256 440"} k={0.08} p={p} stroke width={7} filter={ids.blur3} />
      <Light d={turn ? "M244 262 C238 320 244 380 250 440" : "M242 262 C236 320 242 380 248 440"} k={0.1} p={p} stroke width={3} filter={ids.blur3} />
      <Shade d={`M${150 + t} 352 Q${205 + t} 368 ${262 + t} 342`} k={0.06} p={p} stroke width={10} filter={ids.blur3} />
      <Light d={`M${150 + t} 344 Q${205 + t} 358 ${262 + t} 334`} k={0.1} p={p} stroke width={3} filter={ids.blur3} />
    </g>
  );
}

/** Ribbed collar band between two curves, lit on its top edge. */
function Collar({ p, ids, outer, inner }: { p: Palette; ids: Ids; outer: string; inner: string }) {
  const band = `${outer} ${inner} Z`;
  return (
    <>
      <path d={band} fill={p.base} />
      <path d={band} fill={`url(#${ids.rib})`} />
      <Shade d={band} k={0.06} p={p} />
      <Light d={outer} k={0.34} p={p} stroke width={1.1} />
      <Shade d={inner.replace(/^L/, "M")} k={0.18} p={p} stroke width={0.9} />
    </>
  );
}

/** The inside of the shirt, seen through the neck opening, with its label. */
function NeckInside({ p, d, label }: { p: Palette; d: string; label: [number, number] }) {
  return (
    <>
      <path d={d} fill={p.base} />
      <Shade d={d} k={0.3} p={p} />
      <rect x={label[0] - 7} y={label[1]} width={14} height={9} fill="#fff" fillOpacity={0.9} />
      <path d={`M${label[0] - 4} ${label[1] + 4} H${label[0] + 4} M${label[0] - 4} ${label[1] + 6.5} H${label[0] + 1}`} stroke="#000" strokeOpacity={0.35} strokeWidth={0.8} />
    </>
  );
}

function TeeSeams({ p, turn }: { p: Palette; turn: boolean }) {
  return (
    <>
      {/* Sleeve seams. */}
      <Shade d={turn ? "M96 114 Q104 150 112 180" : "M88 112 Q98 150 106 178"} k={0.1} p={p} stroke />
      <Shade d={turn ? "M312 114 Q300 150 286 180" : "M312 112 Q302 150 294 178"} k={0.1} p={p} stroke />
      {/* Cuffs. */}
      <Cuff d={turn ? "M50 189 Q72 207 98 205" : "M44 187 Q68 209 92 205"} p={p} />
      <Cuff d={turn ? "M298 199 Q314 203 326 188" : "M356 187 Q332 209 308 205"} p={p} />
      {/* Hem: a band with double-needle stitching. */}
      <Shade d={turn ? "M112 433 Q200 445 288 435" : "M104 433 Q200 447 296 433"} k={0.12} p={p} stroke width={0.9} />
      <Light d={turn ? "M112 436 Q200 448 288 438" : "M104 436 Q200 450 296 436"} k={0.18} p={p} stroke width={0.8} />
    </>
  );
}

type PrintProps = { offsetY?: number; scale?: number };

function TeeFront({ p, ids, design, full, print }: { p: Palette; ids: Ids; design: string | null; full: boolean; print?: PrintProps }) {
  return (
    <>
      <FloorShadow ids={ids} />
      {/* Back of the collar just above the shoulders, then the inside of the shirt. */}
      <Collar p={p} ids={ids} outer="M152 88 Q200 78 248 88" inner="L248 88 Q200 86 152 88" />
      <NeckInside p={p} d="M152 88 Q200 86 248 88 Q200 122 152 88 Z" label={[200, 89]} />

      <path d={TEE_BODY} fill={p.base} />
      <Print design={design} {...TEE_PRINT} {...print} clip={ids.print} filter={full ? ids.wrinkle : undefined} p={p} />
      <TeeForm p={p} ids={ids} body={TEE_BODY} turn={false} />

      <Collar p={p} ids={ids} outer="M152 88 Q200 122 248 88" inner="L243 95 Q200 134 157 95" />
      <TeeSeams p={p} turn={false} />
    </>
  );
}

function TeeBack({ p, ids }: { p: Palette; ids: Ids }) {
  return (
    <>
      <FloorShadow ids={ids} />
      <path d={TEE_BODY_BACK} fill={p.base} />
      <TeeForm p={p} ids={ids} body={TEE_BODY_BACK} turn={false} />

      {/* The collar stands a little proud at the back; a shadow sits beneath it. */}
      <Shade d="M157 94 Q200 90 243 94 Q200 114 157 94 Z" k={0.14} p={p} filter={ids.soft} />
      <Collar p={p} ids={ids} outer="M152 88 Q200 78 248 88" inner="L243 94 Q200 90 157 94" />
      <TeeSeams p={p} turn={false} />
    </>
  );
}

/**
 * The three-quarter view. `mirrored` flips the garment for the other side;
 * the print is positioned inside the same flip and un-flipped on itself, so
 * the artwork reads correctly from both sides.
 */
function TeeTurn({
  p,
  ids,
  design,
  mirrored,
  full,
  print,
}: {
  p: Palette;
  ids: Ids;
  design: string | null;
  mirrored: boolean;
  full: boolean;
  print?: PrintProps;
}) {
  // The front faces the viewer's right: the print sits right of centre,
  // foreshortened, and wraps away with a slight lean.
  const cx = TEE_PRINT.x + TEE_PRINT.w / 2;
  const cy = TEE_PRINT.y + TEE_PRINT.h / 2;
  const printTransform = `translate(${212 - cx} 6) translate(${cx} ${cy}) scale(0.72 1) skewY(4) translate(${-cx} ${-cy})`;

  return (
    <g transform={mirrored ? "translate(400 0) scale(-1 1)" : undefined}>
      <FloorShadow ids={ids} cx={198} />
      <Collar p={p} ids={ids} outer="M168 90 Q206 76 248 84" inner="L248 84 Q208 86 168 90" />
      <NeckInside p={p} d="M168 90 Q208 86 248 84 Q212 126 168 90 Z" label={[208, 89]} />

      <path d={TEE_BODY_TURN} fill={p.base} />
      <Print
        design={design}
        {...TEE_PRINT}
        {...print}
        transform={printTransform}
        clip={ids.print}
        filter={full ? ids.wrinkle : undefined}
        mirrored={mirrored}
        p={p}
      />
      <TeeForm p={p} ids={ids} body={TEE_BODY_TURN} turn />

      <Collar p={p} ids={ids} outer="M168 90 Q212 126 248 84" inner="L243 91 Q212 138 173 97" />
      <TeeSeams p={p} turn />
    </g>
  );
}

/** Side profile, facing left. The print is edge-on, so none is drawn. */
function TeeSide({ p, ids }: { p: Palette; ids: Ids }) {
  return (
    <>
      <FloorShadow ids={ids} rx={66} />

      {/* Torso first — the sleeve hangs in front of its top. */}
      <path d={TEE_SIDE_TORSO} fill={p.base} />
      <g clipPath={`url(#${ids.body})`}>
        <path d={TEE_SIDE_TORSO} fill="none" stroke="#000" strokeOpacity={0.11 * p.shadowK} strokeWidth={20} filter={`url(#${ids.soft})`} />
        <rect x={0} y={0} width={400} height={480} fill={`url(#${ids.glow})`} />
        <Blob cx={248} cy={330} rx={18} ry={130} k={0.18} p={p} filter={ids.softer} />
        <Blob cx={158} cy={340} rx={12} ry={120} k={0.07} p={p} filter={ids.softer} />
        {/* The sleeve's shadow on the body beneath it. */}
        <Blob cx={206} cy={240} rx={56} ry={16} k={0.28} p={p} filter={ids.soft} />
        <Blob cx={204} cy={438} rx={44} ry={8} k={0.12} p={p} filter={ids.soft} />
        <Shade d="M180 262 C186 320 180 380 184 440" k={0.1} p={p} stroke width={7} filter={ids.blur3} />
        <Light d="M190 262 C196 320 190 380 194 440" k={0.12} p={p} stroke width={3} filter={ids.blur3} />
        <Shade d="M228 270 C224 330 230 390 226 440" k={0.08} p={p} stroke width={6} filter={ids.blur3} />
        <Light d="M218 274 C214 330 220 390 216 440" k={0.08} p={p} stroke width={3} filter={ids.blur3} />
      </g>
      <Shade d="M158 433 Q204 445 248 433" k={0.12} p={p} stroke width={0.9} />
      <Light d="M158 436 Q204 448 248 436" k={0.18} p={p} stroke width={0.8} />

      {/* The near sleeve, a soft tube pointing at the viewer. */}
      <path d={TEE_SIDE_SLEEVE} fill={p.base} />
      <g clipPath={`url(#${ids.sleeve})`}>
        <path d={TEE_SIDE_SLEEVE} fill="none" stroke="#000" strokeOpacity={0.07 * p.shadowK} strokeWidth={14} filter={`url(#${ids.soft})`} />
        <rect x={0} y={0} width={400} height={480} fill={`url(#${ids.glow})`} />
        <Blob cx={200} cy={116} rx={52} ry={16} k={0.2} p={p} light filter={ids.soft} />
        <Blob cx={258} cy={170} rx={12} ry={46} k={0.14} p={p} filter={ids.softer} />
        <Blob cx={206} cy={214} rx={58} ry={14} k={0.2} p={p} filter={ids.soft} />
        {/* The cuff opening, seen from below as a dark crescent. */}
        <path d="M152 218 Q206 238 258 216 Q206 228 152 218 Z" fill="#000" fillOpacity={Math.min(1, 0.38 * p.shadowK)} />
        <Shade d="M160 204 Q206 220 254 202" k={0.08} p={p} stroke width={6} filter={ids.blur3} />
        <Light d="M162 196 Q206 210 252 194" k={0.12} p={p} stroke width={3} filter={ids.blur3} />
        {/* Shoulder seam over the top of the arm. */}
        <Shade d="M184 104 Q206 98 228 102" k={0.1} p={p} stroke />
      </g>
      <Cuff d="M156 212 Q206 232 256 210" p={p} />

      {/* Collar, edge-on. */}
      <Shade d="M182 98 Q200 106 224 94 Q200 116 182 98 Z" k={0.12} p={p} filter={ids.soft} />
      <Collar p={p} ids={ids} outer="M180 92 Q200 82 226 88" inner="L224 94 Q200 88 182 98" />
    </>
  );
}

/* ----------------------------------- Cap ---------------------------------- */

const CAP_CROWN = "M84 300 C80 232 118 158 200 158 C282 158 320 232 316 300 Q200 316 84 300 Z";
const CAP_FRONT_PANEL =
  "M200 158 C160 164 132 214 128 302 Q200 314 272 302 C268 214 240 164 200 158 Z";
const CAP_VISOR =
  "M74 302 C80 294 130 302 200 306 C270 302 320 294 326 302 C322 344 264 366 200 366 C136 366 78 344 74 302 Z";
const CAP_PRINT = { x: 148, y: 192, w: 104, h: 98 };

/** Turned about 40°, visor to the viewer's lower left. */
const CAP_CROWN_TURN = "M66 300 C62 226 112 156 190 154 C270 152 332 206 328 298 Q196 318 66 300 Z";
const CAP_FRONT_PANEL_TURN =
  "M170 158 C130 166 104 218 100 302 Q156 312 212 306 C226 226 208 162 170 158 Z";
const CAP_VISOR_TURN =
  "M22 322 C14 300 50 288 98 296 L214 306 C218 332 198 352 162 358 C112 366 40 354 22 322 Z";

const CAP_TOP_CROWN = "M68 236 a132 118 0 1 0 264 0 a132 118 0 1 0 -264 0 Z";
const CAP_TOP_VISOR = "M92 304 C78 364 130 404 200 404 C270 404 322 364 308 304 Q200 336 92 304 Z";

function CapButton({ p, x, y }: { p: Palette; x: number; y: number }) {
  return (
    <>
      <circle cx={x} cy={y} r={6.5} fill={p.base} />
      <Shade d={`M${x - 6.5} ${y} a6.5 6.5 0 0 0 13 0 a6.5 6.5 0 0 0 -13 0 Z`} k={0.28} p={p} />
      <circle cx={x - 2} cy={y - 2} r={2.4} fill="#fff" fillOpacity={Math.min(1, 0.35 * p.lightK)} />
      <circle cx={x} cy={y} r={6.5} fill="none" stroke="#000" strokeOpacity={0.25 * p.shadowK} strokeWidth={0.8} />
    </>
  );
}

function Eyelet({ p, x, y }: { p: Palette; x: number; y: number }) {
  return (
    <>
      <circle cx={x} cy={y} r={3.6} fill="none" stroke="#000" strokeOpacity={0.3 * p.shadowK} strokeWidth={1.6} />
      <circle cx={x} cy={y} r={3.6} fill="none" stroke="#fff" strokeOpacity={Math.min(1, 0.25 * p.lightK)} strokeWidth={0.6} />
      <circle cx={x} cy={y} r={1.8} fill="#000" fillOpacity={0.45} />
    </>
  );
}

function VisorStitches({ p, d }: { p: Palette; d: string[] }) {
  return (
    <>
      {d.map((path, i) => (
        <g key={i}>
          <Shade d={path} k={0.22} p={p} stroke width={1} />
          <Light d={path} k={0.18} p={p} stroke width={0.6} />
        </g>
      ))}
    </>
  );
}

/** Rim occlusion, grain and a soft lit dome for whichever crown is in view. */
function CrownForm({ p, ids, crown, turn = false }: { p: Palette; ids: Ids; crown: string; turn?: boolean }) {
  return (
    <g clipPath={`url(#${ids.crown})`}>
      <path d={crown} fill="none" stroke="#000" strokeOpacity={0.2 * p.shadowK} strokeWidth={22} filter={`url(#${ids.soft})`} />
      <rect x={0} y={0} width={400} height={480} fill={`url(#${ids.glow})`} />
      <Blob cx={turn ? 100 : 106} cy={250} rx={30} ry={70} k={0.2} p={p} filter={ids.softer} />
      <Blob cx={turn ? 300 : 296} cy={250} rx={36} ry={70} k={turn ? 0.1 : 0.16} p={p} filter={ids.softer} />
      <Blob cx={turn ? 160 : 168} cy={196} rx={48} ry={30} k={0.22} p={p} light filter={ids.softer} />
      <Blob cx={200} cy={308} rx={120} ry={12} k={0.26} p={p} filter={ids.soft} />
    </g>
  );
}

function VisorForm({ p, ids, turn = false }: { p: Palette; ids: Ids; turn?: boolean }) {
  return (
    <g clipPath={`url(#${ids.visor})`}>
      <rect x={0} y={200} width={400} height={200} fill={`url(#${ids.glow})`} />
      {turn ? (
        <>
          <Blob cx={120} cy={360} rx={110} ry={16} k={0.4} p={p} filter={ids.soft} />
          <Blob cx={120} cy={302} rx={110} ry={9} k={0.3} p={p} filter={ids.soft} />
          <Blob cx={40} cy={330} rx={30} ry={30} k={0.2} p={p} filter={ids.softer} />
          <Blob cx={140} cy={322} rx={50} ry={10} k={0.14} p={p} light filter={ids.soft} />
        </>
      ) : (
        <>
          <Blob cx={200} cy={366} rx={130} ry={12} k={0.4} p={p} filter={ids.soft} />
          <Blob cx={200} cy={304} rx={130} ry={9} k={0.28} p={p} filter={ids.soft} />
          <Blob cx={90} cy={330} rx={30} ry={30} k={0.18} p={p} filter={ids.softer} />
          <Blob cx={310} cy={330} rx={30} ry={30} k={0.1} p={p} filter={ids.softer} />
          <Blob cx={190} cy={326} rx={70} ry={10} k={0.14} p={p} light filter={ids.soft} />
        </>
      )}
    </g>
  );
}

function CapFront({ p, ids, design, full, print }: { p: Palette; ids: Ids; design: string | null; full: boolean; print?: PrintProps }) {
  return (
    <>
      <FloorShadow ids={ids} cy={382} rx={112} />
      {/* Visor first — the crown sits over its root. */}
      <path d={CAP_VISOR} fill={p.base} />
      <VisorForm p={p} ids={ids} />
      <g clipPath={`url(#${ids.visor})`}>
        <VisorStitches
          p={p}
          d={[
            "M84 322 C140 352 260 352 316 322",
            "M92 334 C146 360 254 360 308 334",
            "M104 346 C154 368 246 368 296 346",
          ]}
        />
      </g>

      <path d={CAP_CROWN} fill={p.base} />
      <Print design={design} {...CAP_PRINT} {...print} align="xMidYMid" clip={ids.print} filter={full ? ids.wrinkle : undefined} p={p} />
      <CrownForm p={p} ids={ids} crown={CAP_CROWN} />

      {/* Panel seams. */}
      <Shade d="M200 158 C160 164 132 214 128 302" k={0.24} p={p} stroke />
      <Light d="M202 159 C162 165 134 215 130 303" k={0.16} p={p} stroke width={0.8} />
      <Shade d="M200 158 C240 164 268 214 272 302" k={0.24} p={p} stroke />
      <Light d="M198 159 C238 165 266 215 270 303" k={0.16} p={p} stroke width={0.8} />
      <Eyelet p={p} x={110} y={232} />
      <Eyelet p={p} x={290} y={232} />
      <CapButton p={p} x={200} y={158} />
    </>
  );
}

function CapTurn({
  p,
  ids,
  design,
  mirrored,
  full,
  print,
}: {
  p: Palette;
  ids: Ids;
  design: string | null;
  mirrored: boolean;
  full: boolean;
  print?: PrintProps;
}) {
  const cx = CAP_PRINT.x + CAP_PRINT.w / 2;
  const cy = CAP_PRINT.y + CAP_PRINT.h / 2;
  // Front panel now sits left of centre and faces the viewer's left.
  const printTransform = `translate(${158 - cx} 2) translate(${cx} ${cy}) scale(0.7 1) skewY(-8) translate(${-cx} ${-cy})`;

  return (
    <g transform={mirrored ? "translate(400 0) scale(-1 1)" : undefined}>
      <FloorShadow ids={ids} cx={176} cy={374} rx={112} />
      <path d={CAP_VISOR_TURN} fill={p.base} />
      <VisorForm p={p} ids={ids} turn />
      <g clipPath={`url(#${ids.visor})`}>
        <VisorStitches
          p={p}
          d={[
            "M34 328 C60 350 124 358 204 320",
            "M46 338 C72 356 132 362 200 330",
            "M60 348 C86 362 140 366 194 340",
          ]}
        />
      </g>

      <path d={CAP_CROWN_TURN} fill={p.base} />
      <Print
        design={design}
        {...CAP_PRINT}
        {...print}
        align="xMidYMid"
        transform={printTransform}
        clip={ids.print}
        filter={full ? ids.wrinkle : undefined}
        mirrored={mirrored}
        p={p}
      />
      <CrownForm p={p} ids={ids} crown={CAP_CROWN_TURN} turn />

      <Shade d="M170 158 C130 166 104 218 100 302" k={0.24} p={p} stroke />
      <Light d="M172 159 C132 167 106 219 102 303" k={0.16} p={p} stroke width={0.8} />
      <Shade d="M170 158 C208 162 226 226 212 306" k={0.24} p={p} stroke />
      <Light d="M168 159 C206 163 224 227 210 307" k={0.16} p={p} stroke width={0.8} />
      <Shade d="M170 158 C252 160 306 212 306 300" k={0.16} p={p} stroke />
      <Eyelet p={p} x={258} y={222} />
      <CapButton p={p} x={170} y={158} />
    </g>
  );
}

function CapBack({ p, ids }: { p: Palette; ids: Ids }) {
  const tips = "M60 302 Q200 290 340 302 Q200 324 60 302 Z";
  return (
    <>
      <FloorShadow ids={ids} cy={330} rx={116} />
      {/* The visor's tips, showing either side of the crown. */}
      <path d={tips} fill={p.base} />
      <Shade d={tips} k={0.32} p={p} />

      <path d={CAP_CROWN} fill={p.base} />
      <CrownForm p={p} ids={ids} crown={CAP_CROWN} />
      <g clipPath={`url(#${ids.crown})`}>
        {/* Opening for the strap, dark inside. */}
        <path d="M166 308 C168 262 232 262 234 308 Z" fill="#000" fillOpacity={0.55} />
        <path d="M166 308 C168 262 232 262 234 308" fill="none" stroke="#000" strokeOpacity={0.3} strokeWidth={1.2} />
      </g>

      <Shade d="M200 158 C160 164 132 214 128 302" k={0.24} p={p} stroke />
      <Shade d="M200 158 C240 164 268 214 272 302" k={0.24} p={p} stroke />
      <Shade d="M200 158 L200 268" k={0.24} p={p} stroke />

      {/* Adjustable strap and buckle. */}
      <rect x={140} y={280} width={120} height={16} fill={p.base} />
      <Shade d="M140 280 H260 V296 H140 Z" k={0.1} p={p} />
      <Shade d="M140 288 H260 V296 H140 Z" k={0.14} p={p} />
      <Shade d="M150 284 H182 M150 292 H182 M218 284 H250 M218 292 H250" k={0.22} p={p} stroke width={0.8} />
      <rect x={188} y={276} width={24} height={24} fill={p.base} />
      <Shade d="M188 276 H212 V300 H188 Z" k={0.28} p={p} />
      <rect x={188} y={276} width={24} height={24} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={1.2} />
      <Light d="M190 278 H210" k={0.4} p={p} stroke />
      <path d="M200 279 V297" stroke="#000" strokeOpacity={0.35} strokeWidth={1.5} />

      <Eyelet p={p} x={110} y={232} />
      <Eyelet p={p} x={290} y={232} />
      <CapButton p={p} x={200} y={158} />
    </>
  );
}

/** Straight down onto the crown, visor toward the bottom of the frame. */
function CapTop({ p, ids }: { p: Palette; ids: Ids }) {
  const CX = 200;
  const CY = 236;
  const RX = 132;
  const RY = 118;
  const rim = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return [CX + RX * Math.cos(a), CY + RY * Math.sin(a)] as const;
  };
  const seam = (deg: number) => {
    const [x, y] = rim(deg);
    // Bow the seam a little so the dome reads as a dome.
    const mx = CX + (x - CX) * 0.5 + (y - CY) * 0.08;
    const my = CY + (y - CY) * 0.5 - (x - CX) * 0.08;
    return `M${CX} ${CY} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  };

  return (
    <>
      <FloorShadow ids={ids} cy={420} rx={120} />
      <path d={CAP_TOP_VISOR} fill={p.base} />
      <g clipPath={`url(#${ids.visor})`}>
        <rect x={0} y={200} width={400} height={240} fill={`url(#${ids.glow})`} />
        <Blob cx={200} cy={404} rx={110} ry={12} k={0.4} p={p} filter={ids.soft} />
        <Blob cx={100} cy={340} rx={30} ry={50} k={0.18} p={p} filter={ids.softer} />
          <VisorStitches
          p={p}
          d={[
            "M100 332 C96 374 140 396 200 396 C260 396 304 374 300 332",
            "M108 346 C106 380 148 390 200 390 C252 390 294 380 292 346",
            "M118 358 C118 384 156 386 200 386 C244 386 282 384 282 358",
          ]}
        />
      </g>

      <path d={CAP_TOP_CROWN} fill={p.base} />
      <g clipPath={`url(#${ids.crown})`}>
        <path d={CAP_TOP_CROWN} fill="none" stroke="#000" strokeOpacity={0.2 * p.shadowK} strokeWidth={24} filter={`url(#${ids.soft})`} />
        <rect x={0} y={0} width={400} height={480} fill={`url(#${ids.glow})`} />
        <Blob cx={286} cy={300} rx={60} ry={60} k={0.22} p={p} filter={ids.softer} />
        <Blob cx={150} cy={180} rx={60} ry={44} k={0.24} p={p} light filter={ids.softer} />
        </g>

      {[50, 130, 200, 270, 340].map((deg) => (
        <Shade key={deg} d={seam(deg)} k={0.24} p={p} stroke />
      ))}
      {[90, 165, 15, 235, 305].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return <Eyelet key={deg} p={p} x={CX + RX * 0.55 * Math.cos(a)} y={CY + RY * 0.55 * Math.sin(a)} />;
      })}
      <CapButton p={p} x={CX} y={CY} />
    </>
  );
}

/* --------------------------------- Assembly -------------------------------- */

export function GarmentMockup({
  category,
  view,
  color,
  design,
  className,
  title,
  quality = "full",
  backdrop = true,
  print,
}: GarmentMockupProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const p = palette(color);
  const ids: Ids = {
    body: `gb${uid}`,
    print: `gp${uid}`,
    visor: `gv${uid}`,
    crown: `gc${uid}`,
    sleeve: `gh${uid}`,
    soft: `gs${uid}`,
    softer: `gt${uid}`,
    blur3: `gu${uid}`,
    wrinkle: `gw${uid}`,
    rib: `gi${uid}`,
    backdrop: `gk${uid}`,
    glow: `gg${uid}`,
  };

  const isTee = category === "tshirt";
  // Only the T-shirt has a profile view; a cap asked for one shows its front.
  const side = isTee && view === "side";
  const turned = view === "left" || view === "right";
  const mirrored = view === "left";
  const full = quality === "full";

  // Clip paths depend on the view's silhouette. They are written in unflipped
  // coordinates and referenced from inside the flipped group for the "left"
  // views, which is exactly where they need to be — a clip is applied in the
  // user space of the element that references it.
  const bodyPath = isTee
    ? side
      ? TEE_SIDE_TORSO
      : turned
        ? TEE_BODY_TURN
        : view === "back"
          ? TEE_BODY_BACK
          : TEE_BODY
    : view === "top"
      ? CAP_TOP_CROWN
      : turned
        ? CAP_CROWN_TURN
        : CAP_CROWN;
  const printClipPath = isTee ? bodyPath : turned ? CAP_FRONT_PANEL_TURN : CAP_FRONT_PANEL;
  const visorPath = view === "top" ? CAP_TOP_VISOR : turned ? CAP_VISOR_TURN : CAP_VISOR;

  let scene: React.ReactNode;
  if (isTee) {
    if (view === "back") scene = <TeeBack p={p} ids={ids} />;
    else if (side) scene = <TeeSide p={p} ids={ids} />;
    else if (turned) scene = <TeeTurn p={p} ids={ids} design={design} mirrored={mirrored} full={full} print={print} />;
    else scene = <TeeFront p={p} ids={ids} design={design} full={full} print={print} />;
  } else if (view === "back") scene = <CapBack p={p} ids={ids} />;
  else if (view === "top") scene = <CapTop p={p} ids={ids} />;
  else if (turned) scene = <CapTurn p={p} ids={ids} design={design} mirrored={mirrored} full={full} print={print} />;
  else scene = <CapFront p={p} ids={ids} design={design} full={full} print={print} />;

  // The close-up is the front, zoomed onto the print.
  const zoom =
    view === "detail"
      ? isTee
        ? "translate(200 240) scale(2.1) translate(-200 -244)"
        : "translate(200 240) scale(2.05) translate(-200 -246)"
      : undefined;

  const wide = { x: "-25%", y: "-25%", width: "150%", height: "150%" } as const;

  return (
    <svg
      viewBox={VIEW_BOX}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={ids.body}>
          <path d={bodyPath} />
        </clipPath>
        <clipPath id={ids.print}>
          <path d={printClipPath} />
        </clipPath>
        <clipPath id={ids.crown}>
          <path d={bodyPath} />
        </clipPath>
        <clipPath id={ids.visor}>
          <path d={visorPath} />
        </clipPath>
        <clipPath id={ids.sleeve}>
          <path d={TEE_SIDE_SLEEVE} />
        </clipPath>

        {/* Soft shading. */}
        <filter id={ids.soft} {...wide}>
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id={ids.softer} {...wide}>
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <filter id={ids.blur3} {...wide}>
          <feGaussianBlur stdDeviation="3" />
        </filter>

        {/* The cloth is not flat: ripple the print with a low-frequency field. */}
        <filter id={ids.wrinkle} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="2" seed="5" result="w" />
          <feDisplacementMap in="SourceGraphic" in2="w" scale="9" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        {/* Ribbing on the collar. */}
        <pattern id={ids.rib} width="3" height="3" patternUnits="userSpaceOnUse">
          <path d="M1 0 V3" stroke="#000" strokeOpacity={0.2 * p.shadowK} strokeWidth="0.9" />
          <path d="M2.4 0 V3" stroke="#fff" strokeOpacity={Math.min(1, 0.18 * p.lightK)} strokeWidth="0.6" />
        </pattern>

        {/* Key light from the upper left. */}
        <radialGradient id={ids.glow} cx="0.46" cy="0.3" r="0.62">
          <stop offset="0" stopColor="#fff" stopOpacity={Math.min(1, 0.22 * p.lightK)} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </radialGradient>

        {/* Studio backdrop: a soft sweep, brighter behind the garment. */}
        <radialGradient id={ids.backdrop} cx="0.5" cy="0.42" r="0.75">
          <stop offset="0" stopColor="#f4f4f2" />
          <stop offset="0.6" stopColor="#e9e9e6" />
          <stop offset="1" stopColor="#d9d9d5" />
        </radialGradient>
      </defs>

      {backdrop && <rect x={0} y={0} width={400} height={480} fill={`url(#${ids.backdrop})`} />}

      <g transform={zoom}>{scene}</g>
    </svg>
  );
}

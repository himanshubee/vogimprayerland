"use client";

/* eslint-disable @next/next/no-img-element -- these are composited layers
   that must sit pixel-for-pixel on top of one another; next/image's resizing
   and lazy loading would break the overlay. */

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { matrix3d, quadCenter, quadSize, type Quad } from "@/lib/quad";
import type { MockupTemplate } from "@/lib/merch-shared";

/**
 * A real garment photograph, recoloured and printed.
 *
 * The photo is of a plain white garment with its background removed. The
 * fabric colour is a flat fill clipped to the photo's alpha; the design is
 * perspective-warped onto the print area the admin drew; and the photo itself
 * is then multiplied over everything, so its real folds and shadows fall on
 * the colour and the print alike. On dark colours a little of the photo is
 * screened back in, because black multiplied by anything is just black and a
 * real black tee still shows its highlights.
 *
 * The warp needs the box in pixels, so the design appears once the element
 * has been measured — the photo and colour are there from the first paint.
 */

export type PhotoMockupProps = {
  template: MockupTemplate;
  /** Fabric colour, as hex. */
  color: string;
  design: string | null;
  className?: string;
  title?: string;
  /** Tees hang the print from the top of the area; caps centre it. */
  align?: "top" | "center";
  /** Magnify around the print, for the close-up. */
  zoom?: number;
  /** Nudge (percent of the print's height, down is positive) and size. */
  print?: { offsetY?: number; scale?: number };
  /** False leaves the garment blank — an angle that carries no print. */
  showDesign?: boolean;
};

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  if (Number.isNaN(n)) return 0.5;
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** Clip a layer to the garment's own silhouette. */
function maskStyle(photo: string): CSSProperties {
  const url = `url("${photo}")`;
  return {
    WebkitMaskImage: url,
    maskImage: url,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    maskMode: "alpha",
  };
}

const fill: CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%" };
const photoStyle: CSSProperties = { ...fill, objectFit: "contain", objectPosition: "center" };

export function PhotoMockup({
  template,
  color,
  design,
  className = "",
  title,
  align = "center",
  zoom,
  print,
  showDesign = true,
}: PhotoMockupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox((prev) =>
        prev && Math.abs(prev.w - r.width) < 0.5 && Math.abs(prev.h - r.height) < 0.5
          ? prev
          : { w: r.width, h: r.height }
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { photo, width, height, quad } = template;

  // Where the photo actually lands inside the box (object-fit: contain).
  let printLayer: React.ReactNode = null;
  let origin = "50% 50%";
  if (showDesign && box && box.w > 0 && box.h > 0) {
    const scale = Math.min(box.w / width, box.h / height);
    const rw = width * scale;
    const rh = height * scale;
    const ox = (box.w - rw) / 2;
    const oy = (box.h - rh) / 2;
    const px = quad.map(([x, y]) => [ox + (x / 100) * rw, oy + (y / 100) * rh]) as Quad;
    const { w, h } = quadSize(px);
    const [cx, cy] = quadCenter(px);
    origin = `${cx}px ${cy}px`;

    // The admin's placement, inside the warped print area.
    const offsetY = print?.offsetY ?? 0;
    const size = print?.scale ?? 1;
    const placement =
      offsetY || size !== 1 ? `translateY(${offsetY}%) scale(${size})` : undefined;
    const anchor = align === "top" ? "50% 0%" : "50% 50%";

    printLayer = (
      <div style={{ ...fill, ...maskStyle(photo) }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: w,
            height: h,
            transformOrigin: "0 0",
            transform: matrix3d(w, h, px),
          }}
        >
          {design ? (
            <img
              src={design}
              alt=""
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                objectPosition: align === "top" ? "center top" : "center",
                opacity: 0.97,
                transform: placement,
                transformOrigin: anchor,
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 3,
                border: "1.5px dashed rgba(0,0,0,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: Math.max(8, Math.min(w, h) / 9),
                letterSpacing: "0.15em",
                color: "rgba(0,0,0,0.45)",
                fontFamily: "system-ui, sans-serif",
                transform: placement,
                transformOrigin: anchor,
              }}
            >
              YOUR DESIGN
            </div>
          )}
        </div>
      </div>
    );
  }

  // How much of the photo's own light to screen back in for dark fabrics.
  const lum = luminance(color);
  const lift = lum < 0.05 ? 0.28 : lum < 0.12 ? 0.16 : lum < 0.3 ? 0.08 : 0;

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{ isolation: "isolate" }}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <div
        style={{
          ...fill,
          transform: zoom ? `scale(${zoom})` : undefined,
          transformOrigin: origin,
        }}
      >
        {/* 1 — the fabric colour, in the garment's silhouette. */}
        <div style={{ ...fill, backgroundColor: color, ...maskStyle(photo) }} />

        {/* 2 — the design, warped onto the print area. */}
        {printLayer}

        {/* 3 — the photograph's light and shadow, over colour and print alike. */}
        <img src={photo} alt="" draggable={false} style={{ ...photoStyle, mixBlendMode: "multiply" }} />

        {/* 4 — on dark fabric, a touch of the photo's highlights. */}
        {lift > 0 && (
          <img
            src={photo}
            alt=""
            draggable={false}
            style={{ ...photoStyle, mixBlendMode: "screen", opacity: lift }}
          />
        )}
      </div>
    </div>
  );
}

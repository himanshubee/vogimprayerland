import Image from "next/image";
import { BookOpen, Shirt } from "lucide-react";
import { Mockup } from "./Mockup";
import { colorByKey, type CategoryTemplates, type MerchCategory } from "@/lib/merch-shared";
import type { CartKind, CartVariant } from "./cart-store";

/**
 * The small picture beside a basket or order line: a book's cover, or the
 * garment drawn in the colour that was chosen. Sized by the parent.
 */
export function LineThumb({
  kind,
  image,
  category,
  variant,
  templates,
  sizes = "80px",
  className = "",
}: {
  kind: CartKind;
  image: string | null;
  category?: MerchCategory;
  variant?: CartVariant;
  templates?: CategoryTemplates;
  sizes?: string;
  className?: string;
}) {
  if (kind === "merch") {
    return (
      <span className={`relative block aspect-[5/6] bg-ivory-dark ${className}`}>
        {category ? (
          <Mockup
            templates={templates}
            category={category}
            view="front"
            color={colorByKey(variant?.color).hex}
            design={image}
            quality="lite"
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-midnight/40">
            <Shirt size={18} />
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={`relative block aspect-[3/4] bg-midnight/5 ${className}`}>
      {image ? (
        <Image src={image} alt="" fill sizes={sizes} className="object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center bg-midnight text-gold/70">
          <BookOpen size={18} />
        </span>
      )}
    </span>
  );
}

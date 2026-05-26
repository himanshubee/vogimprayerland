import Image from "next/image";

type Props = {
  eyebrow: string;
  title: React.ReactNode;
  intro?: string;
  scripture?: { ref: string; text: string };
  image?: string;
};

export function PageHeader({ eyebrow, title, intro, scripture, image }: Props) {
  return (
    <header className="relative bg-midnight text-white overflow-hidden">
      {image && (
        <div className="absolute inset-0">
          <Image
            src={image}
            alt=""
            fill
            priority
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 hero-tint" />
        </div>
      )}
      <div className="absolute inset-0 starfield opacity-50" />
      <div
        className="absolute -top-20 -right-20 sm:-top-32 sm:-right-32 w-[320px] h-[320px] sm:w-[520px] sm:h-[520px] rounded-full breathe pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(212,164,55,0.25) 0%, transparent 65%)",
        }}
      />
      <div className="absolute top-1/2 -left-16 sm:-left-24 w-48 h-48 sm:w-72 sm:h-72 rounded-full opacity-30 pointer-events-none drift"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.16) 0%, transparent 70%)",
        }} />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-6 py-16 sm:py-24 lg:py-32">
        <p className="eyebrow text-gold">
          <span className="gold-rule mr-3" />
          {eyebrow}
        </p>
        <h1 className="font-display mt-5 sm:mt-6 text-[2.25rem] sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] sm:leading-[1.02] tracking-tight max-w-4xl">
          {title}
        </h1>
        {intro && (
          <p className="mt-5 sm:mt-7 max-w-2xl text-base sm:text-lg text-white/85 leading-relaxed">
            {intro}
          </p>
        )}
        {scripture && (
          <figure className="mt-8 sm:mt-12 max-w-xl border-l-2 border-gold pl-5 sm:pl-6">
            <blockquote className="font-display italic text-lg sm:text-xl text-white/95 leading-snug">
              &ldquo;{scripture.text}&rdquo;
            </blockquote>
            <figcaption className="mt-3 text-[11px] tracking-[0.28em] uppercase text-gold">
              {scripture.ref}
            </figcaption>
          </figure>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
    </header>
  );
}

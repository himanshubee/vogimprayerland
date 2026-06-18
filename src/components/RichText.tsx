import { Fragment } from "react";

/**
 * Renders the lightweight markup used by editable title/heading fields:
 *   - a newline becomes a <br/>
 *   - text wrapped in _underscores_ becomes the italic-gold accent
 *
 * Example: "Where the captive\n_walks free_\nin Jesus' name."
 */
export function RichText({
  text,
  accentClass = "italic text-gold",
}: {
  text: string;
  accentClass?: string;
}) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, li) => (
        <Fragment key={li}>
          {li > 0 && <br />}
          {renderAccents(line, accentClass)}
        </Fragment>
      ))}
    </>
  );
}

function renderAccents(line: string, accentClass: string) {
  // Split on _..._ keeping the captured group so we can style it.
  const parts = line.split(/_([^_]+)_/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className={accentClass}>
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

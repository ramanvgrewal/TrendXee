import { useState } from "react";

/**
 * A product photograph pinned to the board. Some brand stores drop their images
 * without warning, so a failed photo fades into a paper-coloured swatch instead
 * of showing broken-image text.
 */
export function Photo({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <div aria-hidden className={`${className} bg-sand/60`} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

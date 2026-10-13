"use client";

import Image, { type ImageLoader } from "next/image";
import { useState } from "react";

/** Let Unsplash's own CDN resize its photos (no round trip through Next). */
const unsplashLoader: ImageLoader = ({ src, width, quality }) => `${src}&w=${width}&q=${quality ?? 75}`;

type LookImageProps = { src: string; alt: string; label: string; sizes: string; priority?: boolean };

/**
 * A look photo filling its (3:4) frame. Placeholder photos are shown in
 * black and white to sit with the monochrome palette. If a photo fails to
 * load, a quiet grey panel with the look number takes its place.
 */
export default function LookImage({ src, alt, label, sizes, priority }: LookImageProps) {
  const [failed, setFailed] = useState(false);
  const isUnsplash = src.startsWith("https://images.unsplash.com/");

  if (failed) {
    return (
      <div className="absolute inset-0 flex items-end bg-loader-grey p-3" role="img" aria-label={alt}>
        <span className="ui-label text-stone">{label}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={80}
      priority={priority}
      loader={isUnsplash ? unsplashLoader : undefined}
      className={`object-cover ${isUnsplash ? "grayscale" : ""}`}
      onError={() => setFailed(true)}
    />
  );
}

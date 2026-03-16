import { useState, useEffect } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  priority?: boolean;
  "data-testid"?: string;
}

// Detect images that use the -WxH.ext size-suffix naming convention
const SIZE_SUFFIX_RE = /(-(\d+)x(\d+))(\.(jpg|jpeg|png|webp))$/i;

// Generate responsive srcset for images that carry a -WxH size suffix in their URL
function getResponsiveSrcSet(src: string): string {
  const match = src.match(SIZE_SUFFIX_RE);
  if (!match) return "";

  const currentWidth = parseInt(match[2]);
  const currentHeight = parseInt(match[3]);
  const extension = match[4];
  const aspectRatio = currentHeight / currentWidth;

  // Remove the size suffix to get the base URL
  const baseUrl = src.replace(SIZE_SUFFIX_RE, extension);

  const sizes = [
    { width: 300, descriptor: "300w" },
    { width: 768, descriptor: "768w" },
    { width: currentWidth, descriptor: `${currentWidth}w` },
  ];

  const srcSet = sizes
    .filter((s) => s.width <= currentWidth)
    .map((s) => {
      const h = Math.round(s.width * aspectRatio);
      const url = baseUrl.replace(extension, `-${s.width}x${h}${extension}`);
      return `${url} ${s.descriptor}`;
    })
    .join(", ");

  return srcSet || `${src} ${currentWidth}w`;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  "data-testid": testId,
}: OptimizedImageProps) {
  const srcSet = getResponsiveSrcSet(src);

  return (
    <img
      src={src}
      srcSet={srcSet || undefined}
      sizes={
        srcSet
          ? "(max-width: 640px) 300px, (max-width: 1024px) 768px, 1024px"
          : undefined
      }
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      {...(priority && { fetchpriority: "high" as any })}
      className={className}
      data-testid={testId}
    />
  );
}

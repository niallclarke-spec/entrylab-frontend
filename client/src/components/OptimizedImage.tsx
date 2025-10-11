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

// Generate responsive srcset for WordPress images
function getWordPressSrcSet(src: string): string {
  const isWordPressImage = src.includes('admin.entrylab.io');
  if (!isWordPressImage) return "";

  // WordPress image URL pattern: /uploads/2024/01/image-300x200.jpg
  const urlPattern = /(-(\d+)x(\d+))(\.(jpg|jpeg|png|webp))$/i;
  const match = src.match(urlPattern);
  
  if (!match) {
    // No size suffix - generate srcset assuming WordPress default sizes exist
    const extensionMatch = src.match(/\.(jpg|jpeg|png|webp)$/i);
    if (!extensionMatch) return "";
    
    const extension = extensionMatch[0];
    const baseUrl = src.replace(extension, '');
    
    // Generate common WordPress sizes (may 404 if they don't exist, but browser will fallback)
    return [
      `${baseUrl}-300x169${extension} 300w`,
      `${baseUrl}-768x432${extension} 768w`,
      `${baseUrl}-1024x576${extension} 1024w`,
      `${src} 1920w`
    ].join(', ');
  }

  const currentWidth = parseInt(match[2]);
  const currentHeight = parseInt(match[3]);
  const extension = match[4];
  
  // Calculate aspect ratio from current dimensions
  const aspectRatio = currentHeight / currentWidth;
  
  // Remove the size suffix to get base URL
  const baseUrl = src.replace(urlPattern, extension);
  
  // Generate srcset with WordPress standard widths, maintaining aspect ratio
  const sizes = [
    { width: 300, descriptor: '300w' },
    { width: 768, descriptor: '768w' },
    { width: currentWidth, descriptor: `${currentWidth}w` } // include current size
  ];
  
  const srcSet = sizes
    .filter(size => size.width <= currentWidth) // Only include sizes smaller than or equal to current
    .map(size => {
      const height = Math.round(size.width * aspectRatio);
      const url = baseUrl.replace(extension, `-${size.width}x${height}${extension}`);
      return `${url} ${size.descriptor}`;
    })
    .join(', ');

  return srcSet || `${src} ${currentWidth}w`; // Fallback to current image
}

export function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  className = "", 
  priority = false,
  "data-testid": testId 
}: OptimizedImageProps) {
  const isWordPressImage = src.includes('admin.entrylab.io');
  
  // Generate srcset immediately (no async state changes)
  const srcSet = isWordPressImage ? getWordPressSrcSet(src) : "";
  
  return (
    <img
      src={src}
      srcSet={srcSet || undefined}
      sizes={srcSet ? "(max-width: 640px) 300px, (max-width: 1024px) 768px, 1024px" : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      {...(priority && { fetchPriority: "high" as any })}
      className={className}
      data-testid={testId}
    />
  );
}

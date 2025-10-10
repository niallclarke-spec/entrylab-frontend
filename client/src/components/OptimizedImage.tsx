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
    // No size suffix - this is the original/full size image
    return `${src} 1920w`;
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
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [srcSet, setSrcSet] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const isWordPressImage = src.includes('admin.entrylab.io');
    
    if (isWordPressImage) {
      // Generate responsive srcset
      const responsiveSrcSet = getWordPressSrcSet(src);
      setSrcSet(responsiveSrcSet);
      
      // Try WebP format first for better compression
      const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      const webpSrcSet = responsiveSrcSet.replace(/\.(jpg|jpeg|png)/gi, '.webp');
      
      const img = new Image();
      img.onload = () => {
        setImageSrc(webpSrc);
        setSrcSet(webpSrcSet);
        setIsLoading(false);
      };
      img.onerror = () => {
        // Fallback to original format
        setImageSrc(src);
        setSrcSet(responsiveSrcSet);
        setIsLoading(false);
      };
      img.src = webpSrc;
    } else {
      setImageSrc(src);
      setIsLoading(false);
    }
  }, [src]);

  const handleImageError = () => {
    // If image fails to load, fallback to original source
    if (!hasError && imageSrc !== src) {
      setHasError(true);
      setImageSrc(src);
      setSrcSet(""); // Clear srcset on error
    }
  };

  return (
    <>
      {isLoading && (
        <div 
          className={`${className} animate-pulse bg-muted`}
          style={{ width, height }}
        />
      )}
      <img
        src={imageSrc}
        srcSet={srcSet || undefined}
        sizes={srcSet ? "(max-width: 640px) 300px, (max-width: 1024px) 768px, 1024px" : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        {...(priority && { fetchpriority: "high" as any })}
        className={`${className} ${isLoading ? 'hidden' : ''}`}
        data-testid={testId}
        onLoad={() => setIsLoading(false)}
        onError={handleImageError}
      />
    </>
  );
}

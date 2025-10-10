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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if WordPress image can be served as WebP
    const isWordPressImage = src.includes('admin.entrylab.io');
    
    if (isWordPressImage) {
      // WordPress typically supports WebP through plugins or CDN
      // Try WebP first, fallback to original
      const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      
      const img = new Image();
      img.onload = () => {
        setImageSrc(webpSrc);
        setIsLoading(false);
      };
      img.onerror = () => {
        // Fallback to original format
        setImageSrc(src);
        setIsLoading(false);
      };
      img.src = webpSrc;
    } else {
      setImageSrc(src);
      setIsLoading(false);
    }
  }, [src]);

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
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={`${className} ${isLoading ? 'hidden' : ''}`}
        data-testid={testId}
        onLoad={() => setIsLoading(false)}
      />
    </>
  );
}

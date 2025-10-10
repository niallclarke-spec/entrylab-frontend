// Simple in-memory cache with TTL and stale-while-revalidate for WordPress API responses
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  staleWhileRevalidate: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  
  set(key: string, data: any, ttlSeconds: number = 300, staleSeconds: number = 600): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000, // Convert to milliseconds
      staleWhileRevalidate: staleSeconds * 1000,
    });
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    const age = Date.now() - entry.timestamp;
    
    // Check if entry has completely expired (beyond stale-while-revalidate)
    if (age > entry.ttl + entry.staleWhileRevalidate) {
      this.cache.delete(key);
      return null;
    }
    
    // Return data even if stale (allows stale-while-revalidate)
    return entry.data;
  }
  
  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    
    const age = Date.now() - entry.timestamp;
    return age > entry.ttl;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  // Clean up expired entries (respects stale-while-revalidate window)
  cleanup(): void {
    const now = Date.now();
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      // Only delete entries that are beyond stale-while-revalidate window
      if (now - entry.timestamp > entry.ttl + entry.staleWhileRevalidate) {
        this.cache.delete(key);
      }
    });
  }
}

export const apiCache = new MemoryCache();

// Run cleanup every 5 minutes
setInterval(() => {
  apiCache.cleanup();
}, 5 * 60 * 1000);

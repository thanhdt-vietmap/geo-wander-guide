// Request deduplication and caching service
class RequestCache {
  private cache = new Map<string, Promise<any>>();
  private readonly CACHE_DURATION = 5000; // 5 seconds

  /**
   * Get cached result or execute fetch function
   * Prevents duplicate requests for the same operation
   */
  public async getOrFetch<T>(
    key: string, 
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // Check if request is already in progress
    if (this.cache.has(key)) {
      // console.log(`[RequestCache] Using cached request for: ${key}`);
      return this.cache.get(key)!;
    }

    // console.log(`[RequestCache] Starting new request for: ${key}`);
    
    // Start new request
    const promise = fetchFn().catch(error => {
      // Remove from cache on error to allow retry
      this.cache.delete(key);
      throw error;
    });
    
    this.cache.set(key, promise);

    // Clean up cache after duration
    setTimeout(() => {
      this.cache.delete(key);
      // console.log(`[RequestCache] Cache expired for: ${key}`);
    }, this.CACHE_DURATION);

    return promise;
  }

  /**
   * Clear all cached requests
   */
  public clearCache(): void {
    this.cache.clear();
    // console.log('[RequestCache] All cache cleared');
  }

  /**
   * Clear specific cache entry
   */
  public clearCacheEntry(key: string): void {
    this.cache.delete(key);
    // console.log(`[RequestCache] Cache cleared for: ${key}`);
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const requestCache = new RequestCache();

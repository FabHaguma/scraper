// src/cache.js

/**
 * Simple in-memory cache for scraped job data.
 * Stores raw (unfiltered) results per site with a configurable TTL.
 */

const DEFAULT_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

class ScrapeCache {
  constructor(ttlMs = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
    /** @type {Map<string, { data: object, timestamp: number }>} */
    this.store = new Map();
  }

  /**
   * Get cached data for a site, or null if missing/expired.
   * @param {string} siteName
   * @returns {{ allJobs: Array, companyNames: string[] } | null}
   */
  get(siteName) {
    const entry = this.store.get(siteName);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > this.ttlMs) {
      this.store.delete(siteName);
      console.log(`[Cache] ${siteName}: expired (age ${(age / 60000).toFixed(1)} min)`);
      return null;
    }

    console.log(
      `[Cache] ${siteName}: HIT (age ${(age / 60000).toFixed(1)} min, ${entry.data?.allJobs?.length ?? 0} jobs)`
    );
    return entry.data;
  }

  /**
   * Store raw scraped data for a site.
   * @param {string} siteName
   * @param {{ allJobs: Array, companyNames: string[] }} data
   */
  set(siteName, data) {
    this.store.set(siteName, { data, timestamp: Date.now() });
    console.log(`[Cache] ${siteName}: stored ${data?.allJobs?.length ?? 0} jobs`);
  }

  /**
   * Invalidate cache for a specific site, or all sites.
   * @param {string} [siteName]
   */
  invalidate(siteName) {
    if (siteName) {
      this.store.delete(siteName);
    } else {
      this.store.clear();
    }
  }

  /** Get cache status info for all sites. */
  status() {
    const entries = {};
    for (const [site, entry] of this.store) {
      const ageMin = (Date.now() - entry.timestamp) / 60000;
      const remainingMin = Math.max(0, (this.ttlMs - (Date.now() - entry.timestamp)) / 60000);
      entries[site] = {
        jobs: entry.data?.allJobs?.length ?? 0,
        ageMinutes: Math.round(ageMin),
        remainingMinutes: Math.round(remainingMin),
      };
    }
    return entries;
  }
}

export const scrapeCache = new ScrapeCache();

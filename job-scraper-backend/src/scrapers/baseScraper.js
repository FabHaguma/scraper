// src/scrapers/baseScraper.js

import { DEFAULT_KEYWORDS } from './keywords.js';

/**
 * Abstract base class for a web scraper.
 * All concrete scrapers must extend this class and implement fetchAll().
 * filterJobs() is provided with a sensible default but can be overridden.
 */
export class BaseScraper {
  /**
   * Fetch ALL jobs from the source (no keyword filtering).
   * Must be implemented by each subclass.
   *
   * @returns {Promise<{ allJobs: Array, companyNames: string[] }>}
   */
  async fetchAll() {
    throw new Error('fetchAll() must be implemented by subclass');
  }

  /**
   * Filter a raw job list by keyword or keyword list.
   * Subclasses can override for custom filtering (e.g. deadline checks).
   *
   * @param {Array} allJobs - The raw jobs array from fetchAll()
   * @param {string|null} keyword - Single keyword override
   * @param {string[]|null} customKeywords - Custom keyword list
   * @returns {Array} Filtered jobs
   */
  filterJobs(allJobs, keyword = null, customKeywords = null) {
    if (keyword && keyword.toLowerCase() === 'all') {
      return allJobs;
    }

    const filterKeywords = customKeywords || DEFAULT_KEYWORDS;
    let pattern;
    if (keyword) {
      pattern = new RegExp(
        `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'i'
      );
    } else {
      pattern = new RegExp(`\\b(${filterKeywords.join('|')})\\b`, 'i');
    }
    return allJobs.filter((job) => pattern.test(job.title));
  }

  /**
   * High-level scrape: fetch all then filter.
   * Used when cache is not involved (or called by server with cached data).
   *
   * @param {string|null} keyword
   * @param {string[]|null} customKeywords
   * @returns {Promise<{total_jobs: number, unique_companies: number, jobs: Array}>}
   */
  async scrape(keyword = null, customKeywords = null) {
    const { allJobs, companyNames } = await this.fetchAll();
    const filteredJobs = this.filterJobs(allJobs, keyword, customKeywords);
    return {
      total_jobs: allJobs.length,
      unique_companies: companyNames.length,
      jobs: filteredJobs,
    };
  }
}

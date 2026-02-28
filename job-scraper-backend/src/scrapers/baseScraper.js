// src/scrapers/baseScraper.js

/**
 * Abstract base class for a web scraper.
 * All concrete scrapers must extend this class and implement the scrape() method.
 */
export class BaseScraper {
  /**
   * The main method to perform the scraping.
   *
   * @param {string|null} keyword - A specific keyword to filter jobs by.
   *                                If null, use default keywords.
   * @returns {Promise<{total_jobs: number, unique_companies: number, jobs: Array}>}
   */
  async scrape(keyword = null) {
    throw new Error('scrape() must be implemented by subclass');
  }
}

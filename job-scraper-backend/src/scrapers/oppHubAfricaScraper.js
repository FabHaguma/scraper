// src/scrapers/oppHubAfricaScraper.js

import axios from 'axios';
import { BaseScraper } from './baseScraper.js';
import { DEFAULT_KEYWORDS } from './keywords.js';

export class OppHubAfricaScraper extends BaseScraper {
  /**
   * Scraper for 'opphubafrica.com' job listings.
   * Extracts inline JSON data from the HTML page.
   */

  _parseRelativeDate(dateStr) {
    if (!dateStr) return null;

    const today = new Date();
    const str = dateStr.toLowerCase().trim();

    if (str === 'tomorrow') {
      return new Date(today.getTime() + 24 * 60 * 60 * 1000);
    }
    if (str === 'yesterday') {
      return new Date(today.getTime() - 24 * 60 * 60 * 1000);
    }
    if (str === 'today') {
      return new Date(today);
    }

    // Match patterns like "3 days from now", "1 week ago"
    const match = str.match(/(\d+)\s+(day|week|month|year)s?\s+(from now|ago)/);
    if (match) {
      const number = parseInt(match[1]);
      const unit = match[2];
      const direction = match[3];

      let deltaMs = 0;
      switch (unit) {
        case 'day':
          deltaMs = number * 24 * 60 * 60 * 1000;
          break;
        case 'week':
          deltaMs = number * 7 * 24 * 60 * 60 * 1000;
          break;
        case 'month':
          deltaMs = number * 30 * 24 * 60 * 60 * 1000;
          break;
        case 'year':
          deltaMs = number * 365 * 24 * 60 * 60 * 1000;
          break;
      }

      if (direction === 'ago') {
        return new Date(today.getTime() - deltaMs);
      } else {
        return new Date(today.getTime() + deltaMs);
      }
    }

    return null;
  }

  async scrape(keyword = null) {
    const BASE_URL = 'https://opphubafrica.com';
    const HEADERS = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    };

    console.log(`Scraping ${BASE_URL}...`);

    let htmlContent;
    try {
      const response = await axios.get(BASE_URL, { headers: HEADERS, timeout: 20000 });
      htmlContent = response.data;
    } catch (err) {
      console.error(`Error fetching ${BASE_URL}: ${err.message}`);
      return { total_jobs: 0, unique_companies: 0, jobs: [] };
    }

    const allJobs = [];
    const companyNames = new Set();

    try {
      // Extract the 'opportunities' JSON array from the embedded script
      let match = htmlContent.match(/opportunities:\s*(\[.*?\])\s*(?:,?\s*\n|,\s*page)/s);

      if (!match) {
        // Fallback regex
        match = htmlContent.match(/opportunities:\s*(\[{.*}\]),/);
      }

      if (match) {
        const rawJson = match[1];
        const opportunities = JSON.parse(rawJson);
        console.log(`Found ${opportunities.length} raw opportunities`);

        for (const item of opportunities) {
          // Only process jobs
          if (item.type !== 'job') continue;

          const jobId = item.id;
          const title = item.title;
          const company = item.company_name || 'Unknown';

          let link = item.url;
          if (!link) {
            const slug = item.slug;
            if (slug) {
              link = `${BASE_URL}/jobs/${slug}`;
            } else if (jobId) {
              link = `${BASE_URL}/jobs/${jobId}`;
            }
          }

          const location = item.location || 'Unknown';
          const deadlineStr = item.deadline || 'N/A';

          let deadlineDate;
          const parsedDate = this._parseRelativeDate(deadlineStr);
          if (parsedDate) {
            deadlineDate = parsedDate.toISOString().split('T')[0];
          } else {
            deadlineDate = deadlineStr;
          }

          allJobs.push({
            title,
            company,
            link,
            location,
            deadline_date: deadlineDate || 'N/A',
          });

          companyNames.add(company);
        }
      } else {
        console.log('Regex match failed for opportunities data.');
      }
    } catch (err) {
      console.error(`Error parsing embedded JSON: ${err.message}`);
    }

    // --- Filtering ---
    let filteredJobs;
    if (keyword) {
      const pattern = new RegExp(
        `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'i'
      );
      filteredJobs = allJobs.filter((job) => pattern.test(job.title));
    } else {
      const pattern = new RegExp(`\\b(${DEFAULT_KEYWORDS.join('|')})\\b`, 'i');
      filteredJobs = allJobs.filter((job) => job.title && pattern.test(job.title));
    }

    return {
      total_jobs: allJobs.length,
      unique_companies: companyNames.size,
      jobs: filteredJobs,
    };
  }
}

// src/scrapers/opportunityScraper.js

import axios from 'axios';
import { BaseScraper } from './baseScraper.js';
import { DEFAULT_KEYWORDS } from './keywords.js';

export class OpportunityScraper extends BaseScraper {
  /**
   * Scraper for 'opportunity.ini.rw' using their internal API.
   */

  _isDeadlineValid(deadlineDateStr) {
    if (deadlineDateStr === 'N/A' || !deadlineDateStr || !deadlineDateStr.trim()) {
      return true; // Include jobs without deadline information
    }

    try {
      let deadlineDate = null;
      const str = deadlineDateStr.trim();

      // Try Date.parse (handles ISO, standard formats)
      const parsed = Date.parse(str);
      if (!isNaN(parsed)) {
        deadlineDate = new Date(parsed);
      }

      if (!deadlineDate) {
        // Try dd-mm-yyyy
        const ddmmyyyy = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (ddmmyyyy) {
          deadlineDate = new Date(
            parseInt(ddmmyyyy[3]),
            parseInt(ddmmyyyy[2]) - 1,
            parseInt(ddmmyyyy[1])
          );
        }
      }

      if (!deadlineDate) {
        // Try dd/mm/yyyy
        const ddmmyyyySlash = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (ddmmyyyySlash) {
          deadlineDate = new Date(
            parseInt(ddmmyyyySlash[3]),
            parseInt(ddmmyyyySlash[2]) - 1,
            parseInt(ddmmyyyySlash[1])
          );
        }
      }

      if (!deadlineDate || isNaN(deadlineDate.getTime())) {
        console.log(`Warning: Could not parse date format: ${deadlineDateStr}`);
        return true; // Include jobs with unparseable dates
      }

      const today = new Date();
      const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

      return deadlineDate >= twoWeeksAgo;
    } catch (err) {
      console.error(`Error parsing deadline date '${deadlineDateStr}':`, err);
      return true;
    }
  }

  async fetchAll() {
    const baseUrl = 'https://opportunityapi.ini.rw/api/opportunities';

    const params = {
      locale: 'en',
      limit: 200,
      offset: 0,
      status: 'approved',
      sort: 'default_ranking',
      q: '',
    };

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      Accept: 'application/json',
      Origin: 'https://opportunity.ini.rw',
      Referer: 'https://opportunity.ini.rw/',
    };

    console.log(`Fetching data from ${baseUrl}...`);

    let data;
    try {
      const response = await axios.get(baseUrl, {
        params,
        headers,
        timeout: 10000,
      });

      if (response.status !== 200) {
        console.log(`Failed to fetch data: Status ${response.status}`);
        return { allJobs: [], companyNames: [] };
      }

      data = response.data;
    } catch (err) {
      console.error(`Error fetching from API: ${err.message}`);
      return { allJobs: [], companyNames: [] };
    }

    // The API returns a list directly or a dict with results/data/items
    let rawJobs = [];
    if (Array.isArray(data)) {
      rawJobs = data;
    } else if (data && typeof data === 'object') {
      if (data.results) rawJobs = data.results;
      else if (data.data) rawJobs = data.data;
      else if (data.items) rawJobs = data.items;
    }

    const allJobs = [];
    const companyNames = new Set();

    for (const job of rawJobs) {
      const slug = job.slug;
      if (!slug) continue;

      const fullLink = `https://opportunity.ini.rw/en/opportunities/${slug}`;
      const title = job.title_en || job.title_rw || 'No Title';

      const publishedDate = job.created_at || 'N/A';
      const deadlineDate = job.closing_date || 'N/A';
      const location = job.location_en || 'Rwanda';

      let companyName = 'Unknown';
      if (job.company_name) {
        companyName = job.company_name;
      } else if (job.company && typeof job.company === 'object') {
        companyName = job.company.name || 'Unknown';
      } else if (typeof job.company === 'string') {
        companyName = job.company;
      }

      allJobs.push({
        title,
        company: companyName,
        link: fullLink,
        published_date: publishedDate,
        deadline_date: deadlineDate,
        location,
      });

      if (companyName !== 'Unknown') {
        companyNames.add(companyName);
      }
    }

    return { allJobs, companyNames: [...companyNames] };
  }

  /**
   * Override filterJobs to also check deadline validity.
   */
  filterJobs(allJobs, keyword = null, customKeywords = null) {
    const filterKeywords = customKeywords || DEFAULT_KEYWORDS;
    let filteredJobs;
    if (keyword) {
      // Single keyword: match title + deadline check
      const pattern = new RegExp(
        `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'i'
      );
      filteredJobs = allJobs.filter(
        (job) => pattern.test(job.title) && this._isDeadlineValid(job.deadline_date)
      );
    } else {
      const pattern = new RegExp(`\\b(${filterKeywords.join('|')})\\b`, 'i');
      filteredJobs = allJobs.filter(
        (job) => pattern.test(job.title) && this._isDeadlineValid(job.deadline_date)
      );
    }
    return filteredJobs;
  }
}

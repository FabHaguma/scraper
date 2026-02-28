// src/scrapers/jobinrwandaScraper.js

import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper } from './baseScraper.js';
import { DEFAULT_KEYWORDS } from './keywords.js';

export class JobInRwandaScraper extends BaseScraper {
  /**
   * Scraper for 'jobinrwanda.com' with filtering and date extraction.
   */
  async scrape(keyword = null) {
    const URL = 'https://www.jobinrwanda.com/jobs/all';
    const BASE_URL = 'https://www.jobinrwanda.com';

    const HEADERS = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    };

    let response;
    try {
      response = await axios.get(URL, { headers: HEADERS, timeout: 15000 });
    } catch (err) {
      console.error(`Error fetching the URL: ${err.message}`);
      return { total_jobs: 0, unique_companies: 0, jobs: [] };
    }

    const $ = cheerio.load(response.data);
    const jobElements = $('article.node--type-job');

    const allJobs = [];
    const companyNames = new Set();

    jobElements.each((_, el) => {
      const $el = $(el);
      const titleEl = $el.find('h5.card-title');
      const linkEl = titleEl.closest('a').length ? titleEl.closest('a') : titleEl.parent('a');
      const companyEl = $el.find('p.card-text > a').first();

      // Extract the full text block to get dates
      const cardTextEl = $el.find('p.card-text').first();
      const fullCardText = cardTextEl.text().replace(/\s+/g, ' ').trim();

      // Use regex to find the dates
      const publishedMatch = fullCardText.match(/Published on ([\d-]+)/);
      const deadlineMatch = fullCardText.match(/Deadline ([\d-]+)/);

      const publishedDate = publishedMatch ? publishedMatch[1] : 'N/A';
      const deadlineDate = deadlineMatch ? deadlineMatch[1] : 'N/A';

      if (titleEl.length && linkEl.length) {
        const title = titleEl.text().trim();
        const link = BASE_URL + linkEl.attr('href');
        const company = companyEl.length ? companyEl.text().trim() : 'N/A';

        allJobs.push({
          title,
          company,
          link,
          published_date: publishedDate,
          deadline_date: deadlineDate,
        });

        if (company !== 'N/A') {
          companyNames.add(company);
        }
      }
    });

    // --- Filtering Logic ---
    let pattern;
    if (keyword) {
      pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    } else {
      pattern = new RegExp(`\\b(${DEFAULT_KEYWORDS.join('|')})\\b`, 'i');
    }

    const filteredJobs = allJobs.filter((job) => pattern.test(job.title));

    return {
      total_jobs: allJobs.length,
      unique_companies: companyNames.size,
      jobs: filteredJobs,
    };
  }
}

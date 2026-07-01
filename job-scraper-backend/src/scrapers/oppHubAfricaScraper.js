// src/scrapers/oppHubAfricaScraper.js

import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper } from './baseScraper.js';

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

  async fetchAll() {
    // The main jobs page where listings are displayed
    const JOBS_URL = 'https://opphubafrica.com/jobs';
    const BASE_URL = 'https://opphubafrica.com';
    const HEADERS = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    };

    console.log(`Scraping ${JOBS_URL}...`);

    let htmlContent;
    try {
      const response = await axios.get(JOBS_URL, { headers: HEADERS, timeout: 20000 });
      htmlContent = response.data;
    } catch (err) {
      console.error(`Error fetching ${JOBS_URL}: ${err.message}`);
      return { allJobs: [], companyNames: [] };
    }

    const allJobs = [];
    const companyNames = new Set();

    try {
      const $ = cheerio.load(htmlContent);
      const articles = $('article');
      console.log(`Found ${articles.length} job articles`);

      articles.each((i, el) => {
        const titleEl = $(el).find('h2, h3, h4').first();
        const title = titleEl.text().trim();
        const companyEl = titleEl.next();
        const company = companyEl.length ? companyEl.text().trim() : 'Unknown';
        
        let linkPath = $(el).find('a').last().attr('href') || '';
        let link = linkPath;
        if (linkPath && !linkPath.startsWith('http')) {
           link = `${BASE_URL}${linkPath}`;
        }

        const spans = [];
        $(el).find('span').each((j, span) => {
           const t = $(span).text().trim();
           if(t) spans.push(t);
        });
        
        const deadlineStr = spans.length > 0 ? spans[0] : '';
        const location = spans.length > 1 ? spans[spans.length - 1] : 'Unknown';

        let deadlineDate;
        if (deadlineStr) {
          const parsedDate = this._parseRelativeDate(deadlineStr);
          if (parsedDate) {
            deadlineDate = parsedDate.toISOString().split('T')[0];
          } else {
            deadlineDate = deadlineStr;
          }
        } else {
          deadlineDate = 'N/A';
        }

        if (title) {
          allJobs.push({
            title,
            company,
            link,
            location,
            published_date: deadlineDate,
          });
          companyNames.add(company);
        }
      });
    } catch (err) {
      console.error(`Error parsing HTML: ${err.message}`);
    }

    // --- Return raw data for caching ---
    return { allJobs, companyNames: [...companyNames] };
  }
}

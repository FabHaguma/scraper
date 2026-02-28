// src/scrapers/greatrwandajobsScraper.js

import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper } from './baseScraper.js';
import { DEFAULT_KEYWORDS } from './keywords.js';

export class GreatRwandaJobsScraper extends BaseScraper {
  /**
   * Scraper for 'greatrwandajobs.com' job listings.
   */

  _isDeadlineValid(deadlineDateStr) {
    if (deadlineDateStr === 'N/A' || !deadlineDateStr.trim()) {
      return true; // Include jobs without deadline information
    }

    try {
      const dateFormats = [
        // "Wednesday, May 28 2025" — full weekday, full month
        /^[A-Za-z]+,\s+([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})$/,
        // "15 July 2025"
        /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/,
        // "15-07-2025"
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
        // "15/07/2025"
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
        // "2025-07-15"
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
        // "July 15, 2025"
        /^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/,
      ];

      let deadlineDate = null;
      const str = deadlineDateStr.trim();

      // Try Date.parse first (handles many formats)
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

  async _fetchCategoriesFromWebsite() {
    const HEADERS = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    };

    try {
      const response = await axios.get('https://www.greatrwandajobs.com/jobs/', {
        headers: HEADERS,
        timeout: 20000,
      });

      const $ = cheerio.load(response.data);
      const categorySelect = $('select#category[name="category[]"]');

      if (!categorySelect.length) {
        console.log('Warning: Category select element not found on webpage');
        return [];
      }

      const categories = [];
      categorySelect.find('option').each((_, option) => {
        const value = $(option).attr('value');
        const name = $(option).text().trim();
        if (value && name) {
          categories.push({ value, name });
        }
      });

      console.log(`Successfully fetched ${categories.length} categories from website`);
      return categories;
    } catch (err) {
      console.error(`Error fetching categories from website: ${err.message}`);
      return [];
    }
  }

  async _getAllCategoryUrls() {
    let allCategories = await this._fetchCategoriesFromWebsite();

    if (allCategories.length === 0) {
      console.log('Using fallback static categories');
      allCategories = [
        { value: '10', name: 'Engineering jobs in Rwanda' },
        { value: '13', name: 'Computer/ IT jobs in Rwanda' },
        { value: '47', name: 'Data, Monitoring, and Research jobs in Rwanda' },
        { value: '52', name: 'Technician jobs in Rwanda' },
      ];
    }

    const urls = [];

    for (const category of allCategories) {
      let formattedName = category.name.toLowerCase();
      formattedName = formattedName.replace(/[^a-z0-9\s/\-]/g, '');
      formattedName = formattedName.replace(/[\s/]+/g, '-');
      formattedName = formattedName.replace(/^-+|-+$/g, '');

      const url = `https://www.greatrwandajobs.com/job-categories/newest-jobs/category-${formattedName}-${category.value}`;
      urls.push(url);
    }

    console.log(`Built ${urls.length} category URLs for full fetch`);

    if (urls.length === 0) {
      urls.push(
        'https://www.greatrwandajobs.com/job-categories/newest-jobs/category-computer-it-jobs-in-rwanda-13'
      );
    }

    return urls;
  }

  async fetchAll() {
    const BASE_URL = 'https://www.greatrwandajobs.com';
    const HEADERS = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    };

    const allJobs = [];
    const companyNames = new Set();

    const urlsToScrape = await this._getAllCategoryUrls();

    for (const URL of urlsToScrape) {
      console.log(`Scraping URL: ${URL}`);
      let response;
      try {
        response = await axios.get(URL, { headers: HEADERS, timeout: 20000 });
      } catch (err) {
        console.error(`Error fetching the URL ${URL}: ${err.message}`);
        continue;
      }

      const $ = cheerio.load(response.data);
      const jobContainers = $('div#js-jobs-wrapper');
      console.log(`Found ${jobContainers.length} job containers on ${URL}`);

      const jobElements = [];
      jobContainers.each((_, container) => {
        const toprow = $(container).find('div.js-toprow');
        if (toprow.length) {
          jobElements.push(toprow);
        }
      });

      console.log(`Found ${jobElements.length} job elements on ${URL}`);

      for (const jobEl of jobElements) {
        const $job = $(jobEl);
        const titleElement = $job.find('a.jobtitle');
        if (!titleElement.length) {
          console.log('Skipping job element: no title found');
          continue;
        }

        const title = titleElement.text().trim();
        const link = BASE_URL + titleElement.attr('href');

        // Extract company
        let company = 'N/A';
        const companyDiv = $job.find('div.js-image');
        if (companyDiv.length) {
          const companyImg = companyDiv.find('img');
          if (companyImg.length) {
            company = companyImg.attr('title') || 'N/A';
          }
        }

        const detailsContainer = $job.find('div.js-second-row');
        let category = 'N/A';
        let postedDate = 'N/A';
        let deadlineDate = 'N/A';
        let dutyStation = 'N/A';

        if (detailsContainer.length) {
          // Extract category
          const categorySpan = detailsContainer.find('span').filter(function () {
            return $(this).text().trim() === 'Job Category:';
          });
          if (categorySpan.length) {
            const nextText = categorySpan[0].nextSibling;
            if (nextText) {
              category = nextText.nodeValue ? nextText.nodeValue.trim() : 'N/A';
            }
          }

          // Extract posted date
          const postedSpan = detailsContainer.find('span').filter(function () {
            return $(this).text().trim() === 'Posted:';
          });
          if (postedSpan.length) {
            const nextText = postedSpan[0].nextSibling;
            if (nextText) {
              postedDate = nextText.nodeValue ? nextText.nodeValue.trim() : 'N/A';
            }
          }

          // Extract deadline
          const deadlineSpan = detailsContainer.find('span').filter(function () {
            return /Deadline of this Job/i.test($(this).text());
          });
          if (deadlineSpan.length) {
            const deadlineText = deadlineSpan.parent().text().trim();
            if (deadlineText.includes(':')) {
              deadlineDate = deadlineText.split(':').slice(1).join(':').trim();
            }
          }

          // Extract duty station
          const dutySpan = detailsContainer.find('span').filter(function () {
            return $(this).text().trim() === 'Duty Station:';
          });
          if (dutySpan.length) {
            const nextText = dutySpan[0].nextSibling;
            if (nextText) {
              dutyStation = nextText.nodeValue ? nextText.nodeValue.trim() : 'N/A';
            }
          }
        }

        const jobData = {
          title,
          company,
          link,
          category,
          posted_date: postedDate,
          deadline_date: deadlineDate,
          duty_station: dutyStation,
        };

        // Avoid duplicates
        if (!allJobs.some((existing) => existing.link === link)) {
          allJobs.push(jobData);
        } else {
          console.log(`Skipped duplicate job: ${title}`);
        }

        if (company !== 'N/A') {
          companyNames.add(company);
        }
      }
    }

    console.log(`Total jobs collected: ${allJobs.length}`);

    return { allJobs, companyNames: [...companyNames] };
  }

  /**
   * Override filterJobs to also check deadline validity and category field.
   */
  filterJobs(allJobs, keyword = null, customKeywords = null) {
    const filterKeywords = customKeywords || DEFAULT_KEYWORDS;
    let filteredJobs;
    if (keyword) {
      const pattern = new RegExp(
        `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'i'
      );
      filteredJobs = allJobs.filter(
        (job) =>
          (pattern.test(job.title) || pattern.test(job.category)) &&
          this._isDeadlineValid(job.deadline_date)
      );
    } else {
      const keywordPattern = new RegExp(`\\b(${filterKeywords.join('|')})\\b`, 'i');
      filteredJobs = allJobs.filter(
        (job) =>
          keywordPattern.test(job.title) && this._isDeadlineValid(job.deadline_date)
      );
    }

    console.log(`Jobs after keyword filtering: ${filteredJobs.length}`);
    return filteredJobs;
  }
}

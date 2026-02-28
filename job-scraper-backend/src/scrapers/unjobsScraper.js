// src/scrapers/unjobsScraper.js

import axios from 'axios';
import * as cheerio from 'cheerio';
import randomUseragent from 'random-useragent';
import { BaseScraper } from './baseScraper.js';
import { DEFAULT_KEYWORDS } from './keywords.js';

/**
 * Helper: sleep for a random duration to mimic human behavior.
 */
function humanDelay(minMs = 2000, maxMs = 6000) {
  const delay = Math.random() * (maxMs - minMs) + minMs;
  console.log(`Waiting ${(delay / 1000).toFixed(1)} seconds...`);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export class UNJobsScraper extends BaseScraper {
  /**
   * Advanced UNJobs scraper with anti-detection measures.
   */

  _createStealthHeaders() {
    const userAgent = randomUseragent.getRandom();

    const acceptLanguages = [
      'en-US,en;q=0.9',
      'en-GB,en;q=0.9',
      'en-CA,en;q=0.9',
      'fr-FR,fr;q=0.9,en;q=0.8',
    ];

    return {
      'User-Agent': userAgent,
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': acceptLanguages[Math.floor(Math.random() * acceptLanguages.length)],
      'Accept-Encoding': 'gzip, deflate, br',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': Math.random() > 0.5 ? 'max-age=0' : 'no-cache',
      DNT: '1',
      Pragma: 'no-cache',
    };
  }

  async scrape(keyword = null) {
    const URLS = [
      'https://unjobs.org/duty_stations/rwanda/1',
      'https://unjobs.org/duty_stations/rwanda/2',
    ];

    const allJobs = [];
    const companyNames = new Set();

    // Multiple attempts with different strategies
    for (let attempt = 0; attempt < 3; attempt++) {
      console.log(`\nAttempt ${attempt + 1}/3`);

      const headers = this._createStealthHeaders();

      try {
        // Step 1: Visit main page first to establish cookies
        console.log('Establishing session with main page...');
        const mainResponse = await axios.get('https://unjobs.org/', {
          headers,
          timeout: 20000,
        });
        console.log(`Main page response: ${mainResponse.status}`);

        if (mainResponse.status !== 200) {
          console.log(`Main page returned ${mainResponse.status}, trying different approach...`);
          continue;
        }

        // Extract cookies from main page response
        const cookies = mainResponse.headers['set-cookie'];
        if (cookies) {
          headers.Cookie = cookies.map((c) => c.split(';')[0]).join('; ');
        }

        await humanDelay(3000, 7000);

        // Step 2: Try to access job pages
        for (let i = 0; i < URLS.length; i++) {
          const url = URLS[i];
          try {
            if (i > 0) {
              await humanDelay(4000, 8000);
            }

            // Update headers for subsequent requests
            headers.Referer = i === 0 ? 'https://unjobs.org/' : URLS[i - 1];
            headers['Sec-Fetch-Site'] = 'same-origin';

            console.log(`Fetching: ${url}`);

            const page = await axios.get(url, {
              headers,
              timeout: 30000,
              maxRedirects: 5,
            });

            console.log(`SUCCESS! Fetched ${url} (Status: ${page.status})`);

            const $ = cheerio.load(page.data);
            const jobElements = $('div.job');

            if (!jobElements.length) {
              console.log(`No job elements found on ${url}`);
              continue;
            }

            console.log(`Found ${jobElements.length} job elements on ${url}`);

            let jobsProcessed = 0;
            jobElements.each((_, el) => {
              const $job = $(el);

              // Skip advertisement divs
              if ($job.find('ins.adsbygoogle').length) return;

              const titleElement = $job.find('a.jtitle');
              if (!titleElement.length) return;

              const title = titleElement.text().trim();
              let link = titleElement.attr('href') || '';

              // Make link absolute
              if (link.startsWith('/')) {
                link = 'https://unjobs.org' + link;
              } else if (!link.startsWith('http')) {
                link = 'https://unjobs.org/' + link;
              }

              // Extract company
              const fullText = $job.text().trim();
              const textLines = fullText
                .split('\n')
                .map((l) => l.trim())
                .filter(Boolean);

              let company = 'N/A';
              if (textLines.length >= 2) {
                for (const line of textLines.slice(1)) {
                  if (
                    !line.startsWith('Updated:') &&
                    !line.startsWith('Closing date:') &&
                    line !== title
                  ) {
                    company = line;
                    break;
                  }
                }
              }

              // Extract dates
              const updatedElement = $job.find('time.timeago');
              let updatedDate = 'N/A';
              if (updatedElement.length) {
                updatedDate = updatedElement.attr('datetime') || 'N/A';
                if (updatedDate !== 'N/A') {
                  updatedDate = updatedDate.split('T')[0];
                }
              }

              let closingDate = 'N/A';
              const closingSpan = $job.find('span[id^="j"]').filter(function () {
                return /^j\d+$/.test($(this).attr('id'));
              });
              if (closingSpan.length) {
                const closingText = closingSpan.text().trim();
                if (closingText.includes('Closing date:')) {
                  closingDate = closingText.replace('Closing date:', '').trim();
                }
              }

              allJobs.push({
                title,
                company,
                link,
                updated_date: updatedDate,
                closing_date: closingDate,
              });

              if (company !== 'N/A') {
                companyNames.add(company);
              }

              jobsProcessed++;
            });

            console.log(`Processed ${jobsProcessed} jobs from ${url}`);
          } catch (err) {
            if (err.response && err.response.status === 403) {
              console.log(`403 Forbidden for ${url} on attempt ${attempt + 1}`);
              break; // Exit the URL loop, try next attempt
            }
            console.error(`Error processing ${url}: ${err.message}`);
            continue;
          }
        }

        // If we got jobs, break out of retry loop
        if (allJobs.length > 0) {
          console.log(`Successfully scraped ${allJobs.length} jobs!`);
          break;
        }
      } catch (err) {
        console.error(`Attempt ${attempt + 1} failed: ${err.message}`);
        continue;
      }

      // Wait before next attempt
      if (attempt < 2 && allJobs.length === 0) {
        console.log(`Waiting before attempt ${attempt + 2}...`);
        await humanDelay(10000, 15000);
      }
    }

    console.log(`\nFINAL RESULTS:`);
    console.log(`Total jobs scraped: ${allJobs.length}`);
    console.log(`Unique companies: ${companyNames.size}`);

    if (allJobs.length === 0) {
      console.log('\nUNJobs scraper: No jobs could be scraped due to website restrictions.');
      console.log('Consider these solutions:');
      console.log('   - Use Puppeteer/Playwright for browser automation');
      console.log('   - Implement proxy rotation');
      console.log('   - Use professional scraping services');
      console.log('   - Contact the website for API access');
    }

    // Filter jobs based on keyword or default IT keywords
    let pattern;
    if (keyword) {
      pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    } else {
      pattern = new RegExp(`\\b(${DEFAULT_KEYWORDS.join('|')})\\b`, 'i');
    }

    const filteredJobs = allJobs.filter((job) => pattern.test(job.title));

    console.log(`Filtered jobs (matching criteria): ${filteredJobs.length}`);

    return {
      total_jobs: allJobs.length,
      unique_companies: companyNames.size,
      jobs: filteredJobs,
    };
  }
}

// src/server.js

import express from 'express';
import cors from 'cors';
import { SCRAPERS } from './scrapers/index.js';
import { DEFAULT_KEYWORDS, DEFAULT_CATEGORIES } from './scrapers/keywords.js';
import { formatPublishedDate, formatDeadlineDate, parseDateString } from './scrapers/dateUtils.js';
import { scrapeCache } from './cache.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS to allow the React app to make requests to this backend
app.use(cors());

// --- API Endpoints ---

app.get('/api/sites', (req, res) => {
  /**
   * Returns a list of supported site names that the backend can scrape.
   */
  res.json(Object.keys(SCRAPERS));
});

app.get('/api/keywords', (req, res) => {
  /**
   * Returns the default keyword categories used for job filtering.
   * Shape: { SWE: [...], DATA: [...], IT: [...], CYBER: [...] }
   */
  res.json(DEFAULT_CATEGORIES);
});

app.get('/api/cache', (req, res) => {
  /**
   * Returns the current cache status for all sites.
   */
  res.json(scrapeCache.status());
});

app.get('/api/scrape', async (req, res) => {
  /**
   * The main scraping endpoint.
   * Requires a 'site' query parameter.
   * Optionally accepts a 'keyword' query parameter (single override).
   * Optionally accepts a 'keywords' query parameter (comma-separated list
   * to replace the default keyword list for filtering).
   *
   * Uses an in-memory cache (3-hour TTL) to avoid re-fetching the same
   * site. Only the keyword filtering is re-applied on cached data.
   */
  const siteName = req.query.site;
  const keyword = req.query.keyword || null;
  const customKeywords = req.query.keywords
    ? req.query.keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : null;

  if (!siteName) {
    return res.status(400).json({ error: "A 'site' query parameter is required." });
  }

  if (!(siteName in SCRAPERS)) {
    return res.status(404).json({ error: `Site '${siteName}' is not supported.` });
  }

  const scraper = SCRAPERS[siteName];

  try {
    // Check cache first
    let rawData = scrapeCache.get(siteName);

    if (!rawData) {
      // Cache miss — fetch from website
      console.log(`[Scrape] ${siteName}: fetching from source…`);
      rawData = await scraper.fetchAll();
      scrapeCache.set(siteName, rawData);
    }

    // Apply keyword filtering on the (possibly cached) raw data
    const { allJobs, companyNames } = rawData;
    let filteredJobs = scraper.filterJobs(allJobs, keyword, customKeywords);

    // Sort by most recent published_date first
    filteredJobs.sort((a, b) => {
      const dateA = parseDateString(a.published_date);
      const dateB = parseDateString(b.published_date);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1; // Put missing/unparseable dates at the bottom
      if (!dateB) return -1;
      return dateB.getTime() - dateA.getTime();
    });

    // Format dates before sending
    filteredJobs = filteredJobs.map(job => ({
      ...job,
      published_date: formatPublishedDate(job.published_date),
      deadline_date: formatDeadlineDate(job.deadline_date)
    }));

    const cacheInfo = scrapeCache.status()[siteName];

    res.json({
      total_jobs: allJobs.length,
      unique_companies: companyNames.length,
      jobs: filteredJobs,
      cached: !!cacheInfo,
      cache_remaining_minutes: cacheInfo ? cacheInfo.remainingMinutes : 0,
    });
  } catch (err) {
    console.error(`An error occurred while scraping ${siteName}:`, err);
    res.status(500).json({ error: 'An internal error occurred during scraping.' });
  }
});

app.listen(PORT, () => {
  console.log(`Job Scraper backend running on http://0.0.0.0:${PORT}`);
});

// src/server.js

import express from 'express';
import cors from 'cors';
import { SCRAPERS } from './scrapers/index.js';

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

app.get('/api/scrape', async (req, res) => {
  /**
   * The main scraping endpoint.
   * Requires a 'site' query parameter.
   * Optionally accepts a 'keyword' query parameter.
   *
   * Examples:
   *   /api/scrape?site=jobinrwanda
   *   /api/scrape?site=jobinrwanda&keyword=accountant
   */
  const siteName = req.query.site;
  const keyword = req.query.keyword || null;

  if (!siteName) {
    return res.status(400).json({ error: "A 'site' query parameter is required." });
  }

  if (!(siteName in SCRAPERS)) {
    return res.status(404).json({ error: `Site '${siteName}' is not supported.` });
  }

  const scraper = SCRAPERS[siteName];

  try {
    const data = await scraper.scrape(keyword);
    res.json(data);
  } catch (err) {
    console.error(`An error occurred while scraping ${siteName}:`, err);
    res.status(500).json({ error: 'An internal error occurred during scraping.' });
  }
});

app.listen(PORT, () => {
  console.log(`Job Scraper backend running on http://0.0.0.0:${PORT}`);
});

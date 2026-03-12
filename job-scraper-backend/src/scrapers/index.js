// src/scrapers/index.js

import { JobInRwandaScraper } from './jobinrwandaScraper.js';
import { GreatRwandaJobsScraper } from './greatrwandajobsScraper.js';
import { UNJobsScraper } from './unjobsScraper.js';
import { OpportunityScraper } from './opportunityScraper.js';
import { OppHubAfricaScraper } from './oppHubAfricaScraper.js';

/**
 * Scraper registry - maps site names to scraper instances.
 * To add a new website, import its scraper class and add it here.
 */
export const SCRAPERS = {
  jobinrwanda: new JobInRwandaScraper(),
  greatrwandajobs: new GreatRwandaJobsScraper(),
  // unjobs: new UNJobsScraper(),
  opportunity: new OpportunityScraper(),
  opphubafrica: new OppHubAfricaScraper(),
};

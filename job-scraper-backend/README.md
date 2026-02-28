# Job Scraper Backend API

A Node.js Express backend that scrapes job websites and provides data through a REST API. Designed to be easily extensible to support multiple job sites.

## Prerequisites

- Node.js 18+
- `npm`

## Setup and Installation

1.  **Navigate to the project directory:**

    ```bash
    cd job-scraper-backend
    ```

2.  **Install the dependencies:**

    ```bash
    npm install
    ```

## Running the Backend

Start the server:

```bash
npm start
```

For development with auto-restart on file changes:

```bash
npm run dev
```

The server will start on `http://127.0.0.1:5000`.

## API Endpoints

### 1. Get Supported Sites

-   **URL:** `/api/sites`
-   **Method:** `GET`
-   **Description:** Returns a JSON list of site names that the backend can scrape.
-   **Success Response:**
    ```json
    ["jobinrwanda", "greatrwandajobs", "unjobs", "opportunity", "opphubafrica"]
    ```

### 2. Scrape a Website

-   **URL:** `/api/scrape`
-   **Method:** `GET`
-   **Query Parameters:**
    -   `site` (required): The name of the site to scrape (e.g., `jobinrwanda`).
    -   `keyword` (optional): A custom keyword to filter job titles. If not provided, a default list of IT/software keywords is used.
-   **Success Response:**
    ```json
    {
      "total_jobs": 85,
      "unique_companies": 35,
      "jobs": [
        {
          "title": "Senior Manager, Software Engineer",
          "company": "Muganga SACCO",
          "link": "https://www.jobinrwanda.com/job/senior-manager-software-engineer"
        }
      ]
    }
    ```

## How to Add a New Website to Scrape

1.  **Create a New Scraper File:** Inside `src/scrapers/`, create a new file (e.g., `src/scrapers/newSiteScraper.js`).

2.  **Implement the Scraper Class:**

    ```javascript
    import axios from 'axios';
    import * as cheerio from 'cheerio';
    import { BaseScraper } from './baseScraper.js';
    import { DEFAULT_KEYWORDS } from './keywords.js';

    export class NewSiteScraper extends BaseScraper {
      async scrape(keyword = null) {
        // ... your custom scraping logic ...
        // Return: { total_jobs, unique_companies, jobs: [...] }
      }
    }
    ```

3.  **Register the New Scraper:** In `src/scrapers/index.js`, import and add it:

    ```javascript
    import { NewSiteScraper } from './newSiteScraper.js';

    export const SCRAPERS = {
      // ... existing scrapers ...
      newsite: new NewSiteScraper(),
    };
    ```

4.  **Restart the server.** Your new site will be available via the API.

## Tech Stack

-   **Express** — HTTP server and routing
-   **Axios** — HTTP client for fetching web pages and APIs
-   **Cheerio** — HTML parsing (jQuery-like API for Node.js)
-   **random-useragent** — User agent rotation for stealth scraping
-   **cors** — Cross-Origin Resource Sharing middleware
# Job Scraper

A full-stack web application that scrapes job listings from multiple websites across Rwanda and Africa, filters them by tech-related keywords, and presents the results through a clean React UI.

## Supported Job Sites

| Site | Description |
|------|-------------|
| **jobinrwanda** | Job In Rwanda |
| **greatrwandajobs** | Great Rwanda Jobs |
| **unjobs** | UN Jobs |
| **opportunity** | Opportunity listings |
| **opphubafrica** | OppHub Africa |

## Tech Stack

**Backend** — Node.js, Express 5, Cheerio, Axios  
**Frontend** — React 19, Vite 7  
**Deployment** — Docker, Docker Compose, Nginx, Caddy

## Features

- Scrapes job listings from five websites in a single click
- Keyword filtering with built-in categories (SWE, Data, IT, Cyber)
- Custom keyword categories — add, remove, and toggle keywords
- In-memory cache with a 3-hour TTL to avoid redundant requests
- Responsive UI with loading skeletons and job statistics

## Project Structure

```
├── docker-compose.yml          # Orchestrates backend + frontend services
├── job-scraper-backend/        # Express API & scrapers
│   └── src/
│       ├── server.js           # API endpoints
│       ├── cache.js            # In-memory scrape cache
│       └── scrapers/           # Per-site scraper implementations
└── job-scraper-frontend/       # React SPA
    └── src/
        ├── components/         # UI components
        ├── hooks/              # useJobScraper hook
        └── services/           # API client
```

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

### Run with Docker Compose

```bash
# Create the external network (first time only)
docker network create caddy_network

# Build and start both services
docker compose up --build -d
```

The frontend container serves the React app via Nginx and proxies `/api` requests to the backend on port 5000.

### Local Development (without Docker)

**Backend**

```bash
cd job-scraper-backend
npm install
npm run dev          # starts on http://localhost:5000
```

**Frontend**

```bash
cd job-scraper-frontend
npm install
npm run dev          # starts Vite dev server
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/sites` | List supported site names |
| `GET` | `/api/keywords` | Get default keyword categories |
| `GET` | `/api/cache` | Current cache status for all sites |
| `GET` | `/api/scrape?site=<name>` | Scrape a site and return filtered jobs |

**`/api/scrape` query parameters:**

| Param | Description |
|-------|-------------|
| `site` | **(required)** Site name from `/api/sites` |
| `keyword` | Single keyword override |
| `keywords` | Comma-separated list replacing the default filter keywords |

## License

[Apache 2.0](LICENSE)

# Job Scraper Backend API

This is a Python Flask backend that scrapes job websites and provides the data through a simple REST API. It is designed to be easily extensible to support multiple job sites.

## Prerequisites

- Python 3.8+
- `pip` and `venv` (usually included with Python)

## Setup and Installation

1.  **Clone the repository or create the project files** as described in the structure.

2.  **Create and activate a virtual environment:**

    ```bash
    # For macOS/Linux
    python3 -m venv venv
    source venv/bin/activate

    # For Windows
    python -m venv venv
    ./venv/Scripts/activate
    ```

3.  **Install the required libraries:**

    ```bash
    pip install -r requirements.txt
    ```

## Running the Backend

With your virtual environment active, run the Flask application:

```bash
flask run
```

You should see output indicating that the server is running on `http://127.0.0.1:5000`.

## API Endpoints

### 1. Get Supported Sites

-   **URL:** `/api/sites`
-   **Method:** `GET`
-   **Description:** Returns a JSON list of site names that the backend can scrape.
-   **Success Response:**
    ```json
    [
      "jobinrwanda"
    ]
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

This backend is designed for easy extension.

1.  **Create a New Scraper File:** Inside the `scrapers/` directory, create a new file (e.g., `scrapers/jobinkenya_scraper.py`).

2.  **Implement the Scraper Class:** In the new file, create a class that inherits from `BaseScraper` and implement the `scrape` method. You will need to inspect the HTML of the new website to find the correct tags and classes to use with BeautifulSoup.

    ```python
    # scrapers/jobinkenya_scraper.py
    from .base_scraper import BaseScraper
    import requests
    from bs4 import BeautifulSoup

    class JobInKenyaScraper(BaseScraper):
        def scrape(self, keyword=None):
            # ... your custom scraping logic for jobinkenya.com goes here ...
            # ... remember to return the data in the required dictionary format ...
            pass
    ```

3.  **Register the New Scraper:** In `app.py`, import your new scraper class and add an instance of it to the `SCRAPERS` dictionary.

    ```python
    # app.py
    
    # ... other imports
    from scrapers.jobinrwanda_scraper import JobInRwandaScraper
    from scrapers.jobinkenya_scraper import JobInKenyaScraper # Import the new class

    # ...

    SCRAPERS = {
        "jobinrwanda": JobInRwandaScraper(),
        "jobinkenya": JobInKenyaScraper(), # Register the new scraper
    }
    
    # ... rest of the file
    ```

4.  **Restart the Flask server.** Your new site will now be available via the API.
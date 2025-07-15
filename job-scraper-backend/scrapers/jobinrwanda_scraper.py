# scrapers/jobinrwanda_scraper.py

import requests
import re # Import the regular expressions module
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper
from .keywords import DEFAULT_KEYWORDS

class JobInRwandaScraper(BaseScraper):
    """A scraper for 'jobinrwanda.com' with improved filtering and date extraction."""

    def scrape(self, keyword=None):
        URL = "https://www.jobinrwanda.com/jobs/all"
        BASE_URL = "https://www.jobinrwanda.com"
        
        HEADERS = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        try:
            page = requests.get(URL, headers=HEADERS, timeout=15)
            page.raise_for_status()
        except requests.RequestException as e:
            print(f"Error fetching the URL: {e}")
            return {"total_jobs": 0, "unique_companies": 0, "jobs": []}

        soup = BeautifulSoup(page.content, "html.parser")
        job_elements = soup.find_all("article", class_="node--type-job")

        all_jobs = []
        company_names = set()

        for job_element in job_elements:
            title_element = job_element.find("h5", class_="card-title")
            link_element = title_element.find_parent("a") if title_element else None
            company_element = job_element.select_one("p.card-text > a")
            
            # --- NEW: Extracting the full text block to get dates ---
            card_text_element = job_element.find("p", class_="card-text")
            full_card_text = card_text_element.get_text(separator=' ', strip=True) if card_text_element else ""

            # --- NEW: Using regex to find the dates ---
            published_match = re.search(r"Published on ([\d-]+)", full_card_text)
            deadline_match = re.search(r"Deadline ([\d-]+)", full_card_text)
            
            published_date = published_match.group(1) if published_match else "N/A"
            deadline_date = deadline_match.group(1) if deadline_match else "N/A"

            if title_element and link_element:
                title = title_element.get_text(strip=True)
                link = BASE_URL + link_element["href"]
                company = company_element.get_text(strip=True) if company_element else "N/A"
                
                all_jobs.append({
                    "title": title,
                    "company": company,
                    "link": link,
                    "published_date": published_date,
                    "deadline_date": deadline_date,
                })
                if company != "N/A":
                    company_names.add(company)

        # --- FIX: Filtering Logic ---
        # We now use regular expressions for whole-word matching.
        if keyword:
            # For a custom search, just look for the keyword as a whole word
            pattern = r'\b' + re.escape(keyword) + r'\b'
        else:
            # For the default IT search, build a pattern of all keywords
            pattern = r'\b(' + '|'.join(DEFAULT_KEYWORDS) + r')\b'
        
        # Filter the jobs using the regex pattern (case-insensitive)
        filtered_jobs = [
            job for job in all_jobs 
            if re.search(pattern, job['title'], re.IGNORECASE)
        ]

        return {
            "total_jobs": len(all_jobs),
            "unique_companies": len(company_names),
            "jobs": filtered_jobs
        }
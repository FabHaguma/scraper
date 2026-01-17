from .base_scraper import BaseScraper
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import re
from .keywords import DEFAULT_KEYWORDS

import json

class OppHubAfricaScraper(BaseScraper):
    """A scraper for 'opphubafrica.com' job listings."""

    def _parse_relative_date(self, date_str):
        """
        Parses relative date strings like '3 days from now', '1 week ago', etc.
        Returns a datetime object or None if parsing fails.
        """
        if not date_str:
            return None
            
        today = datetime.now()
        date_str = date_str.lower().strip()
        
        if date_str == 'tomorrow':
            return today + timedelta(days=1)
        if date_str == 'yesterday':
            return today - timedelta(days=1)
        if date_str == 'today':
            return today

        # Regex to find number and unit
        match = re.search(r'(\d+)\s+(day|week|month|year)s?\s+(from now|ago)', date_str)
        if match:
            number = int(match.group(1))
            unit = match.group(2)
            direction = match.group(3)
            
            delta = timedelta()
            if unit == 'day':
                delta = timedelta(days=number)
            elif unit == 'week':
                delta = timedelta(weeks=number)
            elif unit == 'month':
                # Approximation
                delta = timedelta(days=number * 30)
            elif unit == 'year':
                delta = timedelta(days=number * 365)
            
            if direction == 'ago':
                return today - delta
            else:
                return today + delta
                
        return None

    def scrape(self, keyword=None):
        BASE_URL = "https://opphubafrica.com"
        HEADERS = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        print(f"Scraping {BASE_URL}...")
        try:
            response = requests.get(BASE_URL, headers=HEADERS, timeout=20)
            response.raise_for_status()
            html_content = response.text
        except Exception as e:
            print(f"Error fetching {BASE_URL}: {e}")
            return {"total_jobs": 0, "unique_companies": 0, "jobs": []}

        all_jobs = []
        company_names = set()
        
        try:
            # Extract the 'opportunities' JSON array from the embedded script
            # Look for: opportunities: [...]
            # We use re.DOTALL to handle multiline, but based on the file inspection it might be minimized/inline.
            # We'll try to match the specific variable assignment in the Alpine data function.
            match = re.search(r'opportunities:\s*(\[.*?\])\s*(?:,?\s*\n|,\s*page)', html_content, re.DOTALL)
            
            if not match:
                print("Could not find inline opportunities variable in HTML source.")
                # Fallback: maybe the server renders it differently?
                # One more try with simpler boundary
                match = re.search(r'opportunities:\s*(\[{.*}\]),', html_content)
            
            if match:
                raw_json = match.group(1)
                opportunities = json.loads(raw_json)
                print(f"Found {len(opportunities)} raw opportunities")

                for item in opportunities:
                    # 1. Check type
                    if item.get("type") != "job":
                        continue

                    job_id = item.get("id")
                    title = item.get("title")
                    company = item.get("company_name", "Unknown")
                    # Handling relative URL provided in JSON or constructing it
                    link = item.get("url")
                    if not link:
                         slug = item.get("slug")
                         if slug:
                            link = f"{BASE_URL}/jobs/{slug}"
                         elif job_id:
                            link = f"{BASE_URL}/jobs/{job_id}" # Fallback
                    
                    location = item.get("location", "Unknown")
                    
                    deadline_str = item.get("deadline", "N/A")
                    deadline_date = None
                    parsed_date = self._parse_relative_date(deadline_str)
                    
                    if parsed_date:
                        deadline_date = parsed_date.strftime("%Y-%m-%d")
                    else:
                        deadline_date = deadline_str # Fallback

                    job_data = {
                        "title": title,
                        "company": company,
                        "link": link,
                        "location": location,
                        "deadline_date": deadline_date if deadline_date else "N/A",
                    }
                    
                    all_jobs.append(job_data)
                    company_names.add(company)
            else:
                print("Regex match failed for opportunities data.")

        except Exception as e:
            print(f"Error parsing embedded JSON: {e}")

        # --- Filtering ---
        filtered_jobs = []
        if keyword:
            pattern = r'\b' + re.escape(keyword) + r'\b'
            for job in all_jobs:
                if re.search(pattern, job['title'], re.IGNORECASE):
                    filtered_jobs.append(job)
        else:
            # Default IT filtering
            pattern = re.compile(r'\b(' + '|'.join(DEFAULT_KEYWORDS) + r')\b', re.IGNORECASE)
            for job in all_jobs:
                title = job.get('title', '')
                if title and pattern.search(title):
                    filtered_jobs.append(job)

        return {
            "total_jobs": len(all_jobs),
            "unique_companies": len(company_names),
            "jobs": filtered_jobs
        }

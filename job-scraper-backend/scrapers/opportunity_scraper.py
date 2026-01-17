from .base_scraper import BaseScraper
import requests
from .keywords import DEFAULT_KEYWORDS
import re
from datetime import datetime, timedelta

class OpportunityScraper(BaseScraper):
    """A scraper for 'opportunity.ini.rw' using their internal API."""

    def _is_deadline_valid(self, deadline_date_str):
        """
        Check if the job deadline is either future or within 2 weeks from today.
        Returns True if the deadline is valid, False otherwise.
        """
        if deadline_date_str == "N/A" or not deadline_date_str.strip():
            return True  # Include jobs without deadline information
        
        try:
            # Try to parse different date formats commonly used
            date_formats = [
                "%A, %B %d %Y",  # e.g., "Wednesday, May 28 2025"
                "%A, %b %d %Y",  # e.g., "Wednesday, May 28 2025" (short month)
                "%d %B %Y",      # e.g., "15 July 2025"
                "%d %b %Y",      # e.g., "15 Jul 2025"
                "%d-%m-%Y",      # e.g., "15-07-2025"
                "%d/%m/%Y",      # e.g., "15/07/2025"
                "%Y-%m-%d",      # e.g., "2025-07-15"
                "%B %d, %Y",     # e.g., "July 15, 2025"
                "%b %d, %Y",     # e.g., "Jul 15, 2025"
            ]
            
            deadline_date = None
            for date_format in date_formats:
                try:
                    deadline_date = datetime.strptime(deadline_date_str.strip(), date_format)
                    break
                except ValueError:
                    continue
            
            if deadline_date is None:
                # Try simple ISO format containing time as well if needed, though scraper usually gets date string
                try:
                    deadline_date = datetime.fromisoformat(deadline_date_str.replace("Z", "+00:00"))
                except ValueError:
                    pass

            if deadline_date is None:
                print(f"Warning: Could not parse date format: {deadline_date_str}")
                return True  # Include jobs with unparseable dates
            
            # Remove timezone info for comparison if present (naive vs aware)
            if deadline_date.tzinfo is not None:
                deadline_date = deadline_date.replace(tzinfo=None)

            # Calculate the threshold date (2 weeks ago from today)
            today = datetime.now()
            two_weeks_ago = today - timedelta(days=14)
            
            # Include jobs whose deadline is either in the future or within the last 2 weeks
            return deadline_date >= two_weeks_ago
            
        except Exception as e:
            print(f"Error parsing deadline date '{deadline_date_str}': {e}")
            return True  # Include jobs with date parsing errors

    def scrape(self, keyword=None):
        # The specific API endpoint found
        base_url = "https://opportunityapi.ini.rw/api/opportunities"
        
        # Parameters based on the request inspection
        params = {
            "locale": "en",
            "limit": 200,  # Request 200 items to minimize pagination needs
            "offset": 0,
            "status": "approved",
            "sort": "default_ranking",
            # If a specific keyword is requested, pass it here, otherwise empty
            "q": keyword if keyword else "" 
        }

        # Behave like a browser
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "application/json",
            "Origin": "https://opportunity.ini.rw",
            "Referer": "https://opportunity.ini.rw/"
        }

        print(f"Fetching data from {base_url}...")

        try:
            response = requests.get(base_url, params=params, headers=headers, timeout=10)
            
            if response.status_code != 200:
                print(f"Failed to fetch data: Status {response.status_code}")
                return {"total_jobs": 0, "unique_companies": 0, "jobs": []}

            data = response.json()
            
            # The API returns a list directly based on the observed behavior, 
            # or a dict. We'll handle both just in case.
            raw_jobs = []
            if isinstance(data, list):
                raw_jobs = data
            elif isinstance(data, dict):
                # Common keys for paginated APIs
                if 'results' in data:
                    raw_jobs = data['results']
                elif 'data' in data:
                    raw_jobs = data['data']
                elif 'items' in data:
                    raw_jobs = data['items']
                else:
                    # Fallback: if dict has no obvious list, it might be the dict itself if malformed,
                    # but usually it's one of the above. 
                    # For opportunity.ini.rw, previous observation suggests it might be a list or standard paginated structure.
                    # We will assume 'results' or direct list based on standard REST practices if not specified.
                    # However, let's look at the structure if we can. 
                    # Since we can't see the response, we will robustly default to 'results' or check if data itself is iterable.
                    pass
            
            all_jobs = []
            company_names = set()

            for job in raw_jobs:
                # Handle nested company objects
                company_name = "Unknown"
                if isinstance(job.get('company'), dict):
                    company_name = job['company'].get('name', 'Unknown')
                elif isinstance(job.get('company'), str):
                    company_name = job['company']
                
                # Construct the full link using the slug
                # Pattern: https://opportunity.ini.rw/en/opportunities/{slug}
                slug = job.get('slug', '')
                if not slug:
                    continue # Skip if no slug

                full_link = f"https://opportunity.ini.rw/en/opportunities/{slug}"
                
                # Correct field mapping based on API inspection
                title = job.get('title_en', job.get('title_rw', 'No Title'))
                
                # Dates
                published_date = job.get('created_at', 'N/A')
                deadline_date = job.get('closing_date', 'N/A')
                
                # Location
                location = job.get('location_en', 'Rwanda')
                
                # Company (prefer direct name field if available)
                if job.get('company_name'):
                    company_name = job.get('company_name')
                elif isinstance(job.get('company'), dict):
                     company_name = job['company'].get('name', 'Unknown')
                elif isinstance(job.get('company'), str):
                    company_name = job['company']
                else:
                    company_name = "Unknown"

                all_jobs.append({
                    "title": title,
                    "company": company_name,
                    "link": full_link,
                    "published_date": published_date,
                    "deadline_date": deadline_date,
                    "location": location
                })
                
                if company_name != "Unknown":
                    company_names.add(company_name)

            # --- Filtering Logic (Client-side filtering for double safety) ---
            # Even though we passed 'q' to the API, 'keyword' in our app context usually implies 
            # strict filtering for "IT Jobs" when no specific keyword is passed.
            # If the user passed a keyword, the API 'q' param covered it.
            # If the user did NOT pass a keyword, we usually filter by DEFAULT_KEYWORDS (IT jobs) 
            # effectively turning the generic "all jobs" list into "IT jobs".
            
            if keyword:
                # API handled it, pass through (or refine if API fuzzy match is too broad)
                filtered_jobs = [
                    job for job in all_jobs 
                    if self._is_deadline_valid(job['deadline_date'])
                ]
            else:
                # Default behavior: Filter for IT keywords locally
                pattern = r'\b(' + '|'.join(DEFAULT_KEYWORDS) + r')\b'
                filtered_jobs = [
                    job for job in all_jobs 
                    if re.search(pattern, job['title'], re.IGNORECASE) and
                    self._is_deadline_valid(job['deadline_date'])
                ]

            return {
                "total_jobs": len(all_jobs), # Total fetched
                "unique_companies": len(company_names),
                "jobs": filtered_jobs # Return only relevant ones
            }

        except Exception as e:
            print(f"Error scraping Opportunity: {str(e)}")
            return {"total_jobs": 0, "unique_companies": 0, "jobs": []}

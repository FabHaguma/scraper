# scrapers/greatrwandajobs_scraper.py

import requests
import re
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper
from .keywords import DEFAULT_KEYWORDS

class GreatRwandaJobsScraper(BaseScraper):
    """A scraper for 'greatrwandajobs.com' job listings."""

    def _fetch_categories_from_website(self):
        """
        Dynamically fetches all job categories from the website's category dropdown.
        Returns a list of dictionaries with 'value' and 'name' keys.
        """
        HEADERS = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        try:
            # Fetch the main page to get the category dropdown
            response = requests.get("https://www.greatrwandajobs.com/jobs/", headers=HEADERS, timeout=20)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, "html.parser")
            
            # Find the category select element
            category_select = soup.find("select", {"id": "category", "name": "category[]"})
            
            if not category_select:
                print("Warning: Category select element not found on webpage")
                return []
            
            categories = []
            options = category_select.find_all("option")
            
            for option in options:
                value = option.get("value")
                name = option.get_text(strip=True)
                
                # Skip empty options or options without value
                if value and name and value != "":
                    categories.append({
                        "value": value,
                        "name": name
                    })
            
            print(f"Successfully fetched {len(categories)} categories from website")
            return categories
            
        except requests.RequestException as e:
            print(f"Error fetching categories from website: {e}")
            return []
        except Exception as e:
            print(f"Error parsing categories from website: {e}")
            return []

    def _get_category_urls(self):
        """
        Constructs URLs for job categories that match the default IT-related keywords
        by dynamically fetching categories from the website.
        """
        # Fetch categories dynamically from the website
        all_categories = self._fetch_categories_from_website()
        
        # Fallback to static categories if website fetch fails
        if not all_categories:
            print("Using fallback static categories")
            all_categories = [
                {"value": "10", "name": "Engineering jobs in Rwanda"},
                {"value": "13", "name": "Computer/ IT jobs in Rwanda"},
                {"value": "47", "name": "Data, Monitoring, and Research jobs in Rwanda"},
                {"value": "52", "name": "Technician jobs in Rwanda"}
            ]
        
        keyword_pattern = r'\b(' + '|'.join(DEFAULT_KEYWORDS) + r')\b'
        urls = []

        for category in all_categories:
            category_name = category["name"]
            category_id = category["value"]

            # Check if any default keyword is in the category name
            if re.search(keyword_pattern, category_name, re.IGNORECASE):
                # Format category name for URL:
                # 1. Remove " jobs in Rwanda" suffix
                # 2. Make it lowercase
                # 3. Remove special characters except spaces, hyphens, and slashes
                # 4. Replace spaces and slashes with hyphens
                formatted_name = category_name.lower()
                # Remove special characters and replace spaces/slashes with hyphens
                formatted_name = re.sub(r'[^a-z0-9\s/-]', '', formatted_name)
                formatted_name = re.sub(r'[\s/]+', '-', formatted_name)
                # Remove any trailing hyphens
                formatted_name = formatted_name.strip('-')
                
                url = f"https://www.greatrwandajobs.com/job-categories/newest-jobs/category-{formatted_name}-{category_id}"
                urls.append(url)
        
        print(f"Found {len(urls)} relevant category URLs: {urls}")
        
        # If no relevant categories were found, use the default IT jobs page as a fallback
        if not urls:
            urls.append("https://www.greatrwandajobs.com/job-categories/newest-jobs/category-computer-it-jobs-in-rwanda-13")
        
        return urls

    def scrape(self, keyword=None):
        BASE_URL = "https://www.greatrwandajobs.com"
        HEADERS = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        # Define keywords for filtering relevant jobs
        all_jobs = []
        company_names = set()
        
        if keyword:
            # If a specific keyword is provided, search the main jobs page.
            search_url = f"https://www.greatrwandajobs.com/jobs/?search_keywords={keyword}"
            urls_to_scrape = [search_url]
        else:
            # Otherwise, get the list of IT-related category URLs
            urls_to_scrape = self._get_category_urls()
            if not urls_to_scrape:
                # Fallback to a default URL if no categories are found
                urls_to_scrape = ["https://www.greatrwandajobs.com/job-categories/newest-jobs/category-computer-it-jobs-in-rwanda-13"]

        for URL in urls_to_scrape:
            print(f"Scraping URL: {URL}")
            try:
                page = requests.get(URL, headers=HEADERS, timeout=20)
                page.raise_for_status()
            except requests.RequestException as e:
                print(f"Error fetching the URL {URL}: {e}")
                continue # Move to the next URL

            soup = BeautifulSoup(page.content, "html.parser")
            # Find all job containers - each job is wrapped in its own js-jobs-wrapper div
            job_containers = soup.find_all("div", id="js-jobs-wrapper")
            print(f"Found {len(job_containers)} job containers on {URL}")
            
            job_elements = []
            for job_container in job_containers:
                # Find the job posting within each container
                toprow = job_container.find("div", class_="js-toprow")
                if toprow:
                    job_elements.append(toprow)
            
            print(f"Found {len(job_elements)} job elements on {URL}")

            for job_element in job_elements:
                title_element = job_element.find("a", class_="jobtitle")
                if not title_element:
                    print("Skipping job element: no title found")
                    continue
                    
                title = title_element.get_text(strip=True)
                link = BASE_URL + title_element["href"]
                
                # Fix company extraction to handle missing elements
                company = "N/A"
                company_div = job_element.find("div", class_="js-image")
                if company_div:
                    company_img = company_div.find("img")
                    if company_img:
                        company = company_img.get("title", "N/A")
                
                details_container = job_element.find("div", class_="js-second-row")
                category, posted_date, deadline_date, duty_station = "N/A", "N/A", "N/A", "N/A"

                if details_container:
                    category_element = details_container.find("span", string="Job Category: ")
                    if category_element and category_element.parent:
                        category = category_element.find_next_sibling(string=True).strip()

                    posted_element = details_container.find("span", string="Posted: ")
                    if posted_element and posted_element.parent:
                        posted_date = posted_element.find_next_sibling(string=True).strip()

                    deadline_element = details_container.find("span", string=re.compile(r"Deadline of this Job"))
                    if deadline_element and deadline_element.parent:
                        deadline_text = deadline_element.parent.get_text(strip=True)
                        if ":" in deadline_text:
                            deadline_date = deadline_text.split(":", 1)[1].strip()
                    
                    duty_station_element = details_container.find("span", string="Duty Station: ")
                    if duty_station_element and duty_station_element.parent:
                        duty_station = duty_station_element.find_next_sibling(string=True).strip()

                job_data = {
                    "title": title,
                    "company": company,
                    "link": link,
                    "category": category,
                    "posted_date": posted_date,
                    "deadline_date": deadline_date,
                    "duty_station": duty_station
                }
                
                # Avoid adding duplicate jobs by checking the link
                if not any(existing_job['link'] == link for existing_job in all_jobs):
                    all_jobs.append(job_data)
                else:
                    print(f"Skipped duplicate job: {title}")
                
                if company != "N/A":
                    company_names.add(company)

        print(f"Total jobs collected: {len(all_jobs)}")
        # Filter jobs based on relevance to software development
        if keyword:
            # If a specific keyword is provided, filter by that keyword
            pattern = r'\b' + re.escape(keyword) + r'\b'
            filtered_jobs = [
                job for job in all_jobs 
                if re.search(pattern, job['title'], re.IGNORECASE) or 
                   re.search(pattern, job['category'], re.IGNORECASE)
            ]
        else:
            # When no specific keyword is given, filter using DEFAULT_KEYWORDS
            # for additional relevance check on job titles and descriptions
            keyword_pattern = r'\b(' + '|'.join(DEFAULT_KEYWORDS) + r')\b'
            filtered_jobs = []
            
            for job in all_jobs:
                # Check if the job title or category contains relevant keywords
                if re.search(keyword_pattern, job['title'], re.IGNORECASE):
                    filtered_jobs.append(job)

        return {
            "total_jobs": len(all_jobs),
            "filtered_jobs": len(filtered_jobs),
            "unique_companies": len(company_names),
            "jobs": filtered_jobs
        }
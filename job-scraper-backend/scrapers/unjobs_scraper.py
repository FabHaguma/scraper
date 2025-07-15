# scrapers/unjobs_scraper.py

"""
UNJobs Scraper for Rwanda Job Listings

This scraper is designed to extract job listings from unjobs.org/duty_stations/rwanda/.
However, the website implements anti-scraping measures (returns 403 Forbidden for automated requests).

IMPORTANT NOTES:
- The website blocks automated requests with 403 Forbidden errors
- To successfully scrape this site in production, you would need:
  1. Rotating proxies
  2. Browser automation (Selenium/Playwright)
  3. CAPTCHA solving
  4. Request rate limiting and delays
  5. Session management

For demonstration purposes, this scraper properly handles the error and provides
appropriate feedback to the user.

Target Structure:
- Each job is in a <div class="job">
- Job title is in <a class="jtitle">
- Company name follows after <br> tag
- Dates are in <time> elements and <span> elements
"""

import requests
import re
import time
import random
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
from .base_scraper import BaseScraper
from .keywords import DEFAULT_KEYWORDS

class UNJobsScraper(BaseScraper):
    """Advanced UNJobs scraper with anti-detection measures"""
    
    def __init__(self):
        self.ua = UserAgent()
    
    def create_stealth_session(self):
        """Create a session with maximum stealth settings"""
        session = requests.Session()
        
        # Use random user agent
        user_agent = self.ua.random
        
        # Comprehensive headers to mimic real browser
        headers = {
            'User-Agent': user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': random.choice([
                'en-US,en;q=0.9',
                'en-GB,en;q=0.9', 
                'en-CA,en;q=0.9',
                'fr-FR,fr;q=0.9,en;q=0.8'
            ]),
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': random.choice(['max-age=0', 'no-cache']),
            'DNT': '1',
            'Pragma': 'no-cache',
        }
        
        session.headers.update(headers)
        
        # Set session timeouts
        session.timeout = 30
        
        return session
    
    def human_delay(self, min_seconds=2, max_seconds=6):
        """Human-like delay with random variation"""
        delay = random.uniform(min_seconds, max_seconds)
        print(f"Waiting {delay:.1f} seconds...")
        time.sleep(delay)

    def scrape(self, keyword=None):
        # URLs for both pages based on pagination shown (1-25 of 39)
        URLS = [
            "https://unjobs.org/duty_stations/rwanda/1",
            "https://unjobs.org/duty_stations/rwanda/2"
        ]
        
        all_jobs = []
        company_names = set()

        # Multiple attempts with different strategies
        for attempt in range(3):  # Try up to 3 times
            print(f"\n🔄 Attempt {attempt + 1}/3")
            
            # Create a fresh stealth session for each attempt
            session = self.create_stealth_session()
            
            try:
                # Step 1: Visit main page first to establish session
                print("🌐 Establishing session with main page...")
                main_response = session.get('https://unjobs.org/', timeout=20)
                print(f"Main page response: {main_response.status_code}")
                
                if main_response.status_code != 200:
                    print(f"⚠️ Main page returned {main_response.status_code}, trying different approach...")
                    continue
                
                # Human-like delay after main page
                self.human_delay(3, 7)
                
                # Step 2: Try to access job pages
                for i, url in enumerate(URLS):
                    try:
                        if i > 0:
                            self.human_delay(4, 8)  # Longer delay between pages
                            
                        # Update headers for subsequent requests
                        session.headers.update({
                            'Referer': 'https://unjobs.org/' if i == 0 else URLS[i-1],
                            'Sec-Fetch-Site': 'same-origin',
                        })
                        
                        print(f"🎯 Fetching: {url}")
                        
                        # Make the request with retry logic
                        page = session.get(url, timeout=30, allow_redirects=True)
                        page.raise_for_status()
                        
                        print(f"✅ SUCCESS! Fetched {url} (Status: {page.status_code})")
                        
                        # Parse the content
                        soup = BeautifulSoup(page.content, "html.parser")
                        job_elements = soup.find_all("div", class_="job")
                        
                        if not job_elements:
                            print(f"⚠️ No job elements found on {url}")
                            continue
                        
                        print(f"📋 Found {len(job_elements)} job elements on {url}")
                        
                        # Process jobs (existing logic)
                        jobs_processed = 0
                        for job_element in job_elements:
                            # Skip advertisement divs
                            if job_element.find("ins", class_="adsbygoogle"):
                                continue
                            
                            # Extract job data
                            title_element = job_element.find("a", class_="jtitle")
                            if not title_element:
                                continue
                            
                            title = title_element.get_text(strip=True)
                            link = title_element.get("href", "")
                            
                            # Make link absolute
                            if link.startswith("/"):
                                link = "https://unjobs.org" + link
                            elif not link.startswith("http"):
                                link = "https://unjobs.org/" + link
                            
                            # Extract company
                            full_text = job_element.get_text(separator='\n', strip=True)
                            text_lines = [line.strip() for line in full_text.split('\n') if line.strip()]
                            
                            company = "N/A"
                            if len(text_lines) >= 2:
                                for line in text_lines[1:]:
                                    if (not line.startswith("Updated:") and 
                                        not line.startswith("Closing date:") and 
                                        line != title):
                                        company = line
                                        break
                            
                            # Extract dates
                            updated_element = job_element.find("time", class_="timeago")
                            updated_date = "N/A"
                            if updated_element:
                                updated_date = updated_element.get("datetime", "N/A")
                                if updated_date != "N/A":
                                    updated_date = updated_date.split("T")[0]
                            
                            closing_date = "N/A"
                            closing_span = job_element.find("span", id=re.compile(r"^j\d+$"))
                            if closing_span and closing_span.get_text(strip=True):
                                closing_text = closing_span.get_text(strip=True)
                                if "Closing date:" in closing_text:
                                    closing_date = closing_text.replace("Closing date:", "").strip()
                            
                            all_jobs.append({
                                "title": title,
                                "company": company,
                                "link": link,
                                "updated_date": updated_date,
                                "closing_date": closing_date,
                            })
                            
                            if company != "N/A":
                                company_names.add(company)
                            
                            jobs_processed += 1
                        
                        print(f"✅ Processed {jobs_processed} jobs from {url}")
                        
                    except requests.exceptions.HTTPError as e:
                        if e.response.status_code == 403:
                            print(f"🚫 403 Forbidden for {url} on attempt {attempt + 1}")
                            break  # Exit the URL loop, try next attempt
                        else:
                            print(f"❌ HTTP error for {url}: {e}")
                            continue
                    except Exception as e:
                        print(f"❌ Error processing {url}: {e}")
                        continue
                
                # If we got jobs, break out of retry loop
                if all_jobs:
                    print(f"🎉 Successfully scraped {len(all_jobs)} jobs!")
                    break
                    
            except Exception as e:
                print(f"❌ Attempt {attempt + 1} failed: {e}")
                continue
            finally:
                session.close()
            
            # Wait before next attempt
            if attempt < 2 and not all_jobs:
                print(f"⏳ Waiting before attempt {attempt + 2}...")
                self.human_delay(10, 15)

        print(f"\n📊 FINAL RESULTS:")
        print(f"Total jobs scraped: {len(all_jobs)}")
        print(f"Unique companies: {len(company_names)}")
        
        # If no jobs were scraped, provide helpful feedback
        if len(all_jobs) == 0:
            print("\n🚫 UNJobs scraper: No jobs could be scraped due to website restrictions.")
            print("💡 Consider these solutions:")
            print("   - Use Selenium/Playwright for browser automation")
            print("   - Implement proxy rotation")
            print("   - Use professional scraping services")
            print("   - Contact the website for API access")
                
        
        # Filter jobs based on keyword or default IT keywords
        if keyword:
            # For a custom search, look for the keyword as a whole word
            pattern = r'\b' + re.escape(keyword) + r'\b'
        else:
            # For the default IT search, build a pattern of all keywords
            pattern = r'\b(' + '|'.join(DEFAULT_KEYWORDS) + r')\b'
        
        # Filter the jobs using the regex pattern (case-insensitive)
        filtered_jobs = [
            job for job in all_jobs 
            if re.search(pattern, job['title'], re.IGNORECASE)
        ]

        print(f"Filtered jobs (matching criteria): {len(filtered_jobs)}")

        return {
            "total_jobs": len(all_jobs),
            "unique_companies": len(company_names),
            "jobs": filtered_jobs
        }
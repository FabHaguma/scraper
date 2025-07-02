# scrapers/base_scraper.py

from abc import ABC, abstractmethod

class BaseScraper(ABC):
    """
    Abstract base class for a web scraper.
    It defines the contract that all concrete scrapers must follow.
    """

    @abstractmethod
    def scrape(self, keyword=None):
        """
        The main method to perform the scraping.

        Args:
            keyword (str, optional): A specific keyword to filter jobs by. 
                                     If None, use default keywords.

        Returns:
            dict: A dictionary containing the scraped data, structured as:
                  {
                      "total_jobs": int,
                      "unique_companies": int,
                      "jobs": [
                          {"title": str, "company": str, "link": str},
                          ...
                      ]
                  }
        """
        pass
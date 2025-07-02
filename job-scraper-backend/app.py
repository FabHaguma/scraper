# app.py

from flask import Flask, jsonify, request
from flask_cors import CORS

# Import our scrapers
from scrapers.jobinrwanda_scraper import JobInRwandaScraper
# To add a new site, you would import its scraper class here
# from scrapers.newsite_scraper import NewSiteScraper

app = Flask(__name__)
# Enable CORS to allow your React app to make requests to this backend
CORS(app) 

# --- Scraper Registration ---
# This dictionary acts as a manager for all available scrapers.
# To add a new website, you just need to add its scraper here.
SCRAPERS = {
    "jobinrwanda": JobInRwandaScraper(),
    # "newsite": NewSiteScraper(), # Example of how you'd add another
}

# --- API Endpoints ---

@app.route('/api/sites', methods=['GET'])
def get_supported_sites():
    """
    An endpoint to tell the frontend which sites are available to scrape.
    """
    return jsonify(list(SCRAPERS.keys()))


@app.route('/api/scrape', methods=['GET'])
def scrape_jobs():
    """
    The main scraping endpoint.
    It requires a 'site' query parameter.
    It optionally accepts a 'keyword' query parameter.
    
    Example usage:
    - /api/scrape?site=jobinrwanda
    - /api/scrape?site=jobinrwanda&keyword=accountant
    """
    site_name = request.args.get('site')
    keyword = request.args.get('keyword')

    if not site_name:
        return jsonify({"error": "A 'site' query parameter is required."}), 400

    if site_name not in SCRAPERS:
        return jsonify({"error": f"Site '{site_name}' is not supported."}), 404

    scraper = SCRAPERS[site_name]
    
    try:
        data = scraper.scrape(keyword=keyword)
        return jsonify(data)
    except Exception as e:
        # Generic error handler for any unexpected issues during scraping
        print(f"An error occurred while scraping {site_name}: {e}")
        return jsonify({"error": "An internal error occurred during scraping."}), 500


if __name__ == '__main__':
    # Run the app in debug mode, which is convenient for development
    app.run(debug=True, port=5000)
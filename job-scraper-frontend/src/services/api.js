// src/services/api.js

const API_BASE_URL = ''; // Local testing: "http://localhost:5000"

export const apiService = {
  async getSites() {
    const response = await fetch(`${API_BASE_URL}/api/sites`);
    if (!response.ok) {
      throw new Error('Could not connect to the backend API.');
    }
    return response.json();
  },

  async scrapeJobs(site, keyword = '') {
    const params = new URLSearchParams();
    params.append('site', site);
    if (keyword) {
      params.append('keyword', keyword);
    }
    
    const url = `${API_BASE_URL}/api/scrape?${params.toString()}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`An error occurred: ${response.statusText}`);
    }
    return response.json();
  }
};

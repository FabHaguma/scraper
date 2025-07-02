// src/services/api.js

const API_BASE_URL = '';

export const apiService = {
  async getSites() {
    const response = await fetch(`${API_BASE_URL}/api/sites`);
    if (!response.ok) {
      throw new Error('Could not connect to the backend API.');
    }
    return response.json();
  },

  async scrapeJobs(site, keyword = '') {
    const url = new URL(`${API_BASE_URL}/api/scrape`);
    url.searchParams.append('site', site);
    if (keyword) {
      url.searchParams.append('keyword', keyword);
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`An error occurred: ${response.statusText}`);
    }
    return response.json();
  }
};

// src/services/api.js

const API_BASE_URL = ''; // Use relative URL - nginx proxies /api to backend

export const apiService = {
  async getSites() {
    const response = await fetch(`${API_BASE_URL}/api/sites`);
    if (!response.ok) {
      throw new Error('Could not connect to the backend API.');
    }
    return response.json();
  },

  /**
   * Returns the default keyword categories object.
   * Shape: { SWE: [...], DATA: [...], IT: [...], CYBER: [...] }
   */
  async getDefaultCategories() {
    const response = await fetch(`${API_BASE_URL}/api/keywords`);
    if (!response.ok) {
      throw new Error('Could not fetch default keyword categories.');
    }
    return response.json();
  },

  async scrapeJobs(site, keyword = '', customKeywords = null) {
    const params = new URLSearchParams();
    params.append('site', site);
    if (keyword) {
      params.append('keyword', keyword);
    }
    if (customKeywords && customKeywords.length > 0 && !keyword) {
      params.append('keywords', customKeywords.join(','));
    }

    const url = `${API_BASE_URL}/api/scrape?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`An error occurred: ${response.statusText}`);
    }
    return response.json();
  },
};

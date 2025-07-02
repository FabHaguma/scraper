// src/hooks/useJobScraper.js

import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export const useJobScraper = () => {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [keyword, setKeyword] = useState('');
  const [jobData, setJobData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const data = await apiService.getSites();
        setSites(data);
        if (data.length > 0) setSelectedSite(data[0]);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchSites();
  }, []);

  const handleSearch = async () => {
    if (!selectedSite) {
      setError('Please select a website to scrape.');
      return;
    }
    
    setIsLoading(true);
    setJobData(null);
    setError(null);

    try {
      const data = await apiService.scrapeJobs(selectedSite, keyword);
      setJobData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sites,
    selectedSite,
    setSelectedSite,
    keyword,
    setKeyword,
    jobData,
    isLoading,
    error,
    handleSearch
  };
};

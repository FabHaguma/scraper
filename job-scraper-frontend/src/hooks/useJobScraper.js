// src/hooks/useJobScraper.js

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

const STORAGE_KEY_CUSTOM_CATS = 'jobScraper_customCategories';
const STORAGE_KEY_ACTIVE_CATS = 'jobScraper_activeCategories';

const loadFromStorage = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

export const useJobScraper = () => {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [keyword, setKeyword] = useState('');
  const [jobData, setJobData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Category management
  // defaultCategories: { SWE: [...], DATA: [...], ... } from the backend
  const [defaultCategories, setDefaultCategories] = useState({});

  // customCategories: user overrides/additions stored in localStorage
  // Shape: { SWE: ['extra1'], MYCAT: ['kw1', 'kw2'] }
  // These are MERGED with defaults — custom keywords for a default category
  // are appended, and entirely new categories are added.
  const [customCategories, setCustomCategories] = useState(() =>
    loadFromStorage(STORAGE_KEY_CUSTOM_CATS, {})
  );

  // activeCategories: set of category names currently enabled for filtering
  const [activeCategories, setActiveCategories] = useState(() =>
    loadFromStorage(STORAGE_KEY_ACTIVE_CATS, null) // null = all active
  );

  // UI state for adding keywords / categories
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CUSTOM_CATS, JSON.stringify(customCategories));
  }, [customCategories]);

  useEffect(() => {
    if (activeCategories !== null) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_CATS, JSON.stringify(activeCategories));
    }
  }, [activeCategories]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [sitesData, categoriesData] = await Promise.all([
          apiService.getSites(),
          apiService.getDefaultCategories(),
        ]);
        setSites(sitesData);
        if (sitesData.length > 0) setSelectedSite(sitesData[0]);
        setDefaultCategories(categoriesData);

        // If no activeCats stored yet, activate all
        setActiveCategories((prev) => {
          if (prev === null) {
            const allCats = [
              ...new Set([
                ...Object.keys(categoriesData),
                ...Object.keys(loadFromStorage(STORAGE_KEY_CUSTOM_CATS, {})),
              ]),
            ];
            return allCats;
          }
          return prev;
        });
      } catch (err) {
        setError(err.message);
      }
    };
    fetchInitialData();
  }, []);

  // Merged view: defaults + custom additions
  const mergedCategories = (() => {
    const merged = {};
    // Start with default categories
    for (const [cat, kws] of Object.entries(defaultCategories)) {
      merged[cat] = [...kws];
    }
    // Merge custom categories (append to existing or create new)
    for (const [cat, kws] of Object.entries(customCategories)) {
      if (merged[cat]) {
        // Add only keywords not already present
        for (const kw of kws) {
          if (!merged[cat].includes(kw)) merged[cat].push(kw);
        }
      } else {
        merged[cat] = [...kws];
      }
    }
    return merged;
  })();

  // All category names in display order (defaults first, then custom-only)
  const allCategoryNames = Object.keys(mergedCategories);

  // Toggle a category on/off
  const toggleCategory = useCallback((catName) => {
    setActiveCategories((prev) => {
      const set = new Set(prev);
      if (set.has(catName)) {
        set.delete(catName);
      } else {
        set.add(catName);
      }
      return [...set];
    });
  }, []);

  // Add a keyword to a specific category
  const addKeywordToCategory = useCallback(
    (catName, kw) => {
      const trimmed = kw.trim().toLowerCase();
      if (!trimmed) return;
      // Check if it already exists in merged
      const existing = mergedCategories[catName] || [];
      if (existing.includes(trimmed)) return;

      setCustomCategories((prev) => {
        const catList = prev[catName] ? [...prev[catName]] : [];
        if (!catList.includes(trimmed)) catList.push(trimmed);
        return { ...prev, [catName]: catList };
      });
      setNewKeywordInput('');
    },
    [mergedCategories]
  );

  // Remove a keyword from a category
  const removeKeywordFromCategory = useCallback(
    (catName, kw) => {
      const isDefault =
        defaultCategories[catName] && defaultCategories[catName].includes(kw);
      if (isDefault) return; // Can't remove defaults (only custom additions)

      setCustomCategories((prev) => {
        const catList = (prev[catName] || []).filter((k) => k !== kw);
        const updated = { ...prev };
        if (catList.length === 0 && !defaultCategories[catName]) {
          // Remove entirely if it's a user-created category with no keywords left
          delete updated[catName];
          // Also remove from active
          setActiveCategories((a) => a.filter((c) => c !== catName));
        } else {
          updated[catName] = catList;
        }
        return updated;
      });
    },
    [defaultCategories]
  );

  // Create a new category
  const createCategory = useCallback(
    (name) => {
      const trimmed = name.trim().toUpperCase();
      if (!trimmed || mergedCategories[trimmed]) return;

      setCustomCategories((prev) => ({ ...prev, [trimmed]: [] }));
      setActiveCategories((prev) => [...prev, trimmed]);
      setExpandedCategory(trimmed);
      setNewCategoryInput('');
    },
    [mergedCategories]
  );

  // Reset to defaults (clear all custom)
  const resetToDefaults = useCallback(() => {
    setCustomCategories({});
    setActiveCategories(Object.keys(defaultCategories));
    localStorage.removeItem(STORAGE_KEY_CUSTOM_CATS);
  }, [defaultCategories]);

  // Flatten active categories into a keyword array for the API
  const flattenActiveKeywords = useCallback(() => {
    if (!activeCategories || activeCategories.length === 0) return null;
    const keywords = [];
    for (const cat of activeCategories) {
      const kws = mergedCategories[cat];
      if (kws) {
        for (const kw of kws) {
          if (!keywords.includes(kw)) keywords.push(kw);
        }
      }
    }
    return keywords.length > 0 ? keywords : null;
  }, [activeCategories, mergedCategories]);

  const handleSearch = async () => {
    if (!selectedSite) {
      setError('Please select a website to scrape.');
      return;
    }

    setIsLoading(true);
    setJobData(null);
    setError(null);

    try {
      const keywordsToSend = flattenActiveKeywords();
      const data = await apiService.scrapeJobs(selectedSite, keyword, keywordsToSend);
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
    handleSearch,
    // Category management
    mergedCategories,
    allCategoryNames,
    activeCategories: activeCategories || [],
    defaultCategories,
    toggleCategory,
    addKeywordToCategory,
    removeKeywordFromCategory,
    createCategory,
    resetToDefaults,
    newKeywordInput,
    setNewKeywordInput,
    newCategoryInput,
    setNewCategoryInput,
    expandedCategory,
    setExpandedCategory,
    customCategories,
  };
};

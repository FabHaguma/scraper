// src/scrapers/keywords.js

/**
 * Default keyword categories for job filtering across all scrapers.
 * Each category groups related keywords so users can toggle them
 * and extend them with their own additions.
 */
export const DEFAULT_CATEGORIES = {
  SWE: [
    'software', 'developer', 'development', 'engineer', 'engineering',
    'programmer', 'programming', 'backend', 'frontend', 'web', 'fullstack',
  ],
  DATA: [
    'data', 'database', 'analyst', 'analytics', 'machine learning',
    'data science', 'big data',
  ],
  IT: [
    'system', 'network', 'cloud', 'it', 'ict', 'information',
    'technology', 'infrastructure', 'computer', 'devops',
  ],
  CYBER: [
    'cybersecurity', 'security', 'infosec', 'penetration testing',
  ],
};

/**
 * Flat array of all default keywords (used by scrapers as a fallback).
 */
export const DEFAULT_KEYWORDS = [
  ...new Set(Object.values(DEFAULT_CATEGORIES).flat()),
];

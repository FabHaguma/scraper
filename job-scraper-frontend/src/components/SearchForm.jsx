// src/components/SearchForm.jsx

import { useState } from 'react';

const formatSiteName = (slug) =>
  slug
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const SearchForm = ({
  sites,
  selectedSite,
  setSelectedSite,
  keyword,
  setKeyword,
  onSearch,
  isLoading,
  mergedCategories,
  allCategoryNames,
  activeCategories,
  defaultCategories,
  customCategories,
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
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading && selectedSite) onSearch();
  };

  const handleAddKeyDown = (catName) => (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeywordToCategory(catName, newKeywordInput);
    }
  };

  const handleNewCatKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      createCategory(newCategoryInput);
    }
  };

  const isDefaultKeyword = (catName, kw) =>
    defaultCategories[catName] && defaultCategories[catName].includes(kw);

  const hasCustomChanges = Object.keys(customCategories).length > 0;
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  const activeCatCount = activeCategories.length;
  const totalCatCount = allCategoryNames.length;

  return (
    <div className="search-panel">
      <div className="search-panel-label">Select a source</div>
      <div className="site-chips">
        {sites.length > 0 ? (
          sites.map((site) => (
            <button
              key={site}
              className={`site-chip${selectedSite === site ? ' active' : ''}`}
              onClick={() => setSelectedSite(site)}
            >
              {formatSiteName(site)}
            </button>
          ))
        ) : (
          <span className="site-chip" style={{ opacity: 0.5 }}>Loading sources…</span>
        )}
      </div>

      {/* Keyword Categories */}
      <div className="keywords-section">
        <button
          className={`keywords-collapse-toggle${isCategoriesOpen ? ' open' : ''}`}
          onClick={() => setIsCategoriesOpen((v) => !v)}
        >
          <span className="collapse-label">
            <span className={`collapse-chevron${isCategoriesOpen ? ' open' : ''}`}>›</span>
            Keyword categories
          </span>
          <span className="collapse-summary">
            {activeCatCount}/{totalCatCount} active
          </span>
        </button>

        {isCategoriesOpen && (
          <div className="keywords-body">
            <div className="keywords-header">
              {hasCustomChanges && (
                <button className="reset-btn" onClick={resetToDefaults}>
                  Reset to defaults
                </button>
              )}
            </div>

            {/* Category tabs */}
            <div className="category-tabs">
          {allCategoryNames.map((catName) => {
            const isActive = activeCategories.includes(catName);
            const isExpanded = expandedCategory === catName;
            const isCustomOnly = !defaultCategories[catName];
            const kwCount = (mergedCategories[catName] || []).length;
            return (
              <div key={catName} className="category-tab-wrapper">
                <div className={`category-tab${isActive ? ' active' : ''}${isExpanded ? ' expanded' : ''}`}>
                  <button
                    className="category-toggle-btn"
                    onClick={() => toggleCategory(catName)}
                    title={isActive ? 'Disable category' : 'Enable category'}
                  >
                    <span className={`cat-checkbox${isActive ? ' checked' : ''}`} />
                  </button>
                  <button
                    className="category-label-btn"
                    onClick={() => setExpandedCategory(isExpanded ? null : catName)}
                  >
                    <span className="cat-name">
                      {catName}
                      {isCustomOnly && <span className="cat-badge">custom</span>}
                    </span>
                    <span className="cat-count">{kwCount}</span>
                    <span className={`cat-chevron${isExpanded ? ' open' : ''}`}>›</span>
                  </button>
                </div>

                {/* Expanded keyword list */}
                {isExpanded && (
                  <div className="category-keywords">
                    <div className="keyword-chips">
                      {(mergedCategories[catName] || []).map((kw) => {
                        const isDef = isDefaultKeyword(catName, kw);
                        return (
                          <span key={kw} className={`keyword-chip${isDef ? ' default' : ''}`}>
                            {kw}
                            {!isDef && (
                              <button
                                className="keyword-remove"
                                onClick={() => removeKeywordFromCategory(catName, kw)}
                                aria-label={`Remove ${kw}`}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        );
                      })}
                      {(mergedCategories[catName] || []).length === 0 && (
                        <span className="keyword-chip default">No keywords yet</span>
                      )}
                    </div>
                    <div className="keyword-input-row">
                      <input
                        type="text"
                        placeholder={`Add to ${catName}…`}
                        value={newKeywordInput}
                        onChange={(e) => setNewKeywordInput(e.target.value)}
                        onKeyDown={handleAddKeyDown(catName)}
                        className="keyword-input"
                      />
                      <button
                        className="keyword-add-btn"
                        onClick={() => addKeywordToCategory(catName, newKeywordInput)}
                        disabled={!newKeywordInput.trim()}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

            {/* Create new category */}
            <div className="new-category-row">
              <input
                type="text"
                placeholder="New category name…"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onKeyDown={handleNewCatKeyDown}
                className="keyword-input"
              />
              <button
                className="keyword-add-btn"
                onClick={() => createCategory(newCategoryInput)}
                disabled={!newCategoryInput.trim()}
              >
                + Category
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="search-panel-label">Search</div>
      <div className="search-input-row">
        <div className="search-field">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="Optional single keyword (overrides categories above)…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button
          className="search-btn"
          onClick={onSearch}
          disabled={isLoading || !selectedSite}
        >
          {isLoading ? (
            <>
              <span className="spinner" />
              Scanning…
            </>
          ) : (
            'Launch Scan'
          )}
        </button>
      </div>
    </div>
  );
};

export default SearchForm;

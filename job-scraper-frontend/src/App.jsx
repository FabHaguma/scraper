// src/App.jsx

import './App.css';
import Header from './components/Header';
import SearchForm from './components/SearchForm';
import JobResults from './components/JobResults';
import { useJobScraper } from './hooks/useJobScraper';

function App() {
  const {
    sites,
    selectedSite,
    setSelectedSite,
    keyword,
    setKeyword,
    jobData,
    isLoading,
    error,
    handleSearch,
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
  } = useJobScraper();

  return (
    <div className="app-container">
      <Header />

      <SearchForm
        sites={sites}
        selectedSite={selectedSite}
        setSelectedSite={setSelectedSite}
        keyword={keyword}
        setKeyword={setKeyword}
        onSearch={handleSearch}
        isLoading={isLoading}
        mergedCategories={mergedCategories}
        allCategoryNames={allCategoryNames}
        activeCategories={activeCategories}
        defaultCategories={defaultCategories}
        customCategories={customCategories}
        toggleCategory={toggleCategory}
        addKeywordToCategory={addKeywordToCategory}
        removeKeywordFromCategory={removeKeywordFromCategory}
        createCategory={createCategory}
        resetToDefaults={resetToDefaults}
        newKeywordInput={newKeywordInput}
        setNewKeywordInput={setNewKeywordInput}
        newCategoryInput={newCategoryInput}
        setNewCategoryInput={setNewCategoryInput}
        expandedCategory={expandedCategory}
        setExpandedCategory={setExpandedCategory}
      />

      <JobResults jobData={jobData} isLoading={isLoading} error={error} />
    </div>
  );
}

export default App;

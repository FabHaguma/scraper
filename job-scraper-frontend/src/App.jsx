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
    handleSearch
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
      />

      <JobResults
        jobData={jobData}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}

export default App;
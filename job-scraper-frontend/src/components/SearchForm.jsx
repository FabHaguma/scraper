// src/components/SearchForm.jsx

const SearchForm = ({
  sites,
  selectedSite,
  setSelectedSite,
  keyword,
  setKeyword,
  onSearch,
  isLoading
}) => {
  return (
    <div className="search-container">
      <select 
        value={selectedSite} 
        onChange={(e) => setSelectedSite(e.target.value)}
        disabled={sites.length === 0}
      >
        {sites.length > 0 ? (
          sites.map(site => <option key={site} value={site}>{site}</option>)
        ) : (
          <option>Loading sites...</option>
        )}
      </select>
      
      <input
        type="text"
        placeholder="Optional: filter by custom keyword..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <button onClick={onSearch} disabled={isLoading || !selectedSite}>
        {isLoading ? 'Searching...' : 'Search'}
      </button>
    </div>
  );
};

export default SearchForm;

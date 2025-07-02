// src/components/JobResults.jsx

import JobStats from './JobStats';
import JobList from './JobList';

const JobResults = ({ jobData, isLoading, error }) => {
  return (
    <div className="results-container">
      {error && <div className="error-message">Error: {error}</div>}
      {isLoading && <div className="loading-message">Scraping in progress, please wait...</div>}
      
      {jobData && (
        <div>
          <JobStats jobData={jobData} />
          <JobList jobs={jobData.jobs} />
        </div>
      )}
    </div>
  );
};

export default JobResults;

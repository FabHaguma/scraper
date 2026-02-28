// src/components/JobResults.jsx

import JobStats from './JobStats';
import JobList from './JobList';
import SkeletonLoader from './SkeletonLoader';

const JobResults = ({ jobData, isLoading, error }) => {
  return (
    <div className="results-container">
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {isLoading && <SkeletonLoader />}

      {jobData && !isLoading && (
        <>
          <JobStats jobData={jobData} />
          <JobList jobs={jobData.jobs} />
        </>
      )}
    </div>
  );
};

export default JobResults;

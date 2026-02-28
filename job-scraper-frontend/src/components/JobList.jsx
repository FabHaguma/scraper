// src/components/JobList.jsx

import JobCard from './JobCard';

const JobList = ({ jobs }) => {
  if (jobs.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔍</div>
        <h3>No matches found</h3>
        <p>Try a different keyword or scan another source.</p>
      </div>
    );
  }

  return (
    <>
      <div className="job-list-header">
        <span className="job-list-title">Results</span>
        <span className="job-list-count">{jobs.length} job{jobs.length !== 1 && 's'}</span>
      </div>
      <div className="job-list">
        {jobs.map((job, index) => (
          <JobCard key={index} job={job} />
        ))}
      </div>
    </>
  );
};

export default JobList;

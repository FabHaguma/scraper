// src/components/JobList.jsx

import JobCard from './JobCard';

const JobList = ({ jobs }) => {
  return (
    <div className="job-list">
      {jobs.length > 0 ? (
        jobs.map((job, index) => (
          <JobCard key={index} job={job} />
        ))
      ) : (
        <div className="loading-message">
          <p>No jobs found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default JobList;

// src/components/JobStats.jsx

const JobStats = ({ jobData }) => {
  return (
    <div className="stats-display">
      <div className="stat-item">
        <h3>{jobData.total_jobs}</h3>
        <p>Total Jobs Found</p>
      </div>
      <div className="stat-item">
        <h3>{jobData.unique_companies}</h3>
        <p>Unique Companies</p>
      </div>
      <div className="stat-item">
        <h3>{jobData.jobs.length}</h3>
        <p>Relevant Jobs Found</p>
      </div>
    </div>
  );
};

export default JobStats;

// src/components/JobStats.jsx

const JobStats = ({ jobData }) => {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-number">{jobData.total_jobs}</div>
        <div className="stat-label">Total Scanned</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">{jobData.unique_companies}</div>
        <div className="stat-label">Companies</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">{jobData.jobs.length}</div>
        <div className="stat-label">Relevant Matches</div>
      </div>
    </div>
  );
};

export default JobStats;

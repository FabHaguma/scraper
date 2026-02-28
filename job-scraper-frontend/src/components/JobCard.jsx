// src/components/JobCard.jsx

const JobCard = ({ job }) => {
  return (
    <div className="job-card">
      <div className="job-card-header">
        <h3 className="job-title">
          <a href={job.link} target="_blank" rel="noopener noreferrer">
            {job.title}
          </a>
        </h3>
        {job.company && <span className="job-company">🏢 {job.company}</span>}
      </div>

      <div className="job-meta">
        {job.published_date && (
          <span className="job-meta-item">
            <span className="meta-icon">📅</span>
            {job.published_date}
          </span>
        )}
        {job.deadline_date && (
          <span className="job-meta-item deadline">
            <span className="meta-icon">⏰</span>
            {job.deadline_date}
          </span>
        )}
      </div>
    </div>
  );
};

export default JobCard;

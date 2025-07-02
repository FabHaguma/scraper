// src/components/JobCard.jsx

const JobCard = ({ job }) => {
  return (
    <div className="job-card">
      <h2>
        <a href={job.link} target="_blank" rel="noopener noreferrer">
          {job.title}
        </a>
      </h2>
      <p className="job-company">{job.company}</p>
      <div className="job-dates">
        <span>Published: {job.published_date}</span>
        <span>Deadline: {job.deadline_date}</span>
      </div>
    </div>
  );
};

export default JobCard;

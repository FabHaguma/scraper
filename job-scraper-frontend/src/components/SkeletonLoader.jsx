// src/components/SkeletonLoader.jsx

const SkeletonLoader = () => {
  return (
    <div className="skeleton-container">
      <div className="skeleton-stats">
        <div className="skeleton-stat" />
        <div className="skeleton-stat" />
        <div className="skeleton-stat" />
      </div>
      <div className="skeleton-card" />
      <div className="skeleton-card" />
      <div className="skeleton-card" />
      <div className="skeleton-card" />
      <p className="skeleton-text">Scanning job board… this may take a moment</p>
    </div>
  );
};

export default SkeletonLoader;

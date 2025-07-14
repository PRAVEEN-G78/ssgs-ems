import React, { useState } from 'react';
import './PerformanceTracking.css';

const PerformanceTracking = () => {
  const [metrics] = useState([
    {
      id: 1,
      category: 'Productivity',
      score: 85,
      target: 90,
      rating: 4,
      trend: 'up',
    },
    {
      id: 2,
      category: 'Quality',
      score: 92,
      target: 95,
      rating: 4.5,
      trend: 'stable',
    },
    {
      id: 3,
      category: 'Teamwork',
      score: 88,
      target: 85,
      rating: 4,
      trend: 'up',
    },
  ]);

  const [reviews] = useState([
    {
      id: 1,
      date: '2024-03-15',
      reviewer: 'John Manager',
      rating: 4.5,
      comments: 'Excellent work on the recent project. Shows great leadership skills.',
      status: 'completed',
    },
    {
      id: 2,
      date: '2024-02-15',
      reviewer: 'Sarah Lead',
      rating: 4,
      comments: 'Good performance, but could improve on time management.',
      status: 'completed',
    },
  ]);

  const [goals] = useState([
    {
      id: 1,
      title: 'Complete Advanced Training',
      deadline: '2024-06-30',
      progress: 75,
      status: 'on-track',
    },
    {
      id: 2,
      title: 'Lead Team Project',
      deadline: '2024-05-15',
      progress: 30,
      status: 'at-risk',
    },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'on-track':
        return 'status-success';
      case 'in-progress':
        return 'status-warning';
      case 'pending':
        return 'status-info';
      case 'at-risk':
        return 'status-error';
      default:
        return 'status-default';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <span className="trend-icon trend-up">↑</span>;
      case 'down':
        return <span className="trend-icon trend-down">↓</span>;
      default:
        return <span className="trend-icon trend-stable">→</span>;
    }
  };

  const renderRating = (rating) => {
    return (
      <div className="rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''} ${star - 0.5 <= rating && star > rating ? 'half' : ''}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="performance-container">
      <div className="performance-header">
        <h1 className="performance-title">Performance Dashboard</h1>
        <button className="button button-primary" onClick={() => {/* Handle new review */}}>
          <span className="button-icon">+</span>
          New Review
        </button>
      </div>

      {/* Overall Performance Summary */}
      <div className="performance-summary">
        <div className="summary-card overall-rating">
          <div className="card-header">
            <span className="card-icon">🏆</span>
            <h2>Overall Rating</h2>
          </div>
          <div className="rating-value">4.2</div>
          <div className="rating-count">Based on 12 reviews</div>
        </div>
        <div className="summary-card metrics-card">
          <h2>Performance Metrics</h2>
          <div className="metrics-list">
            {metrics.map((metric) => (
              <div key={metric.id} className="metric-item">
                <div className="metric-header">
                  <span className="metric-category">{metric.category}</span>
                  <div className="metric-score">
                    {getTrendIcon(metric.trend)}
                    <span>{metric.score}%</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(metric.score / metric.target) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goals Section */}
      <h2 className="section-title">Performance Goals</h2>
      <div className="goals-grid">
        {goals.map((goal) => (
          <div key={goal.id} className="goal-card">
            <div className="goal-header">
              <h3>{goal.title}</h3>
              <span className={`status-chip ${getStatusColor(goal.status)}`}>
                {goal.status}
              </span>
            </div>
            <div className="goal-details">
              <p>Deadline: {goal.deadline}</p>
              <div className="goal-progress">
                <span>Progress: {goal.progress}%</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Reviews */}
      <h2 className="section-title">Performance Reviews</h2>
      <div className="reviews-table-container">
        <table className="reviews-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Reviewer</th>
              <th>Rating</th>
              <th>Comments</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id}>
                <td>{review.date}</td>
                <td>{review.reviewer}</td>
                <td>{renderRating(review.rating)}</td>
                <td>{review.comments}</td>
                <td>
                  <span className={`status-chip ${getStatusColor(review.status)}`}>
                    {review.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="icon-button edit" title="Edit">
                      ✎
                    </button>
                    <button className="icon-button delete" title="Delete">
                      ×
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PerformanceTracking; 
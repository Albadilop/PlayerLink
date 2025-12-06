import React from 'react';
import type { Review } from '../../types';
import './ProfileReviewsTab.css';

export interface ProfileReviewsTabProps {
  reviews: Review[];
}

export const ProfileReviewsTab: React.FC<ProfileReviewsTabProps> = ({ reviews }) => {
  return (
    <div className="info-section container">
      <div className="row justify-content-around">
        <h3 className="col-1 m-2 mb-4">Comments</h3>
        <div className="col-auto m-2 mb-4"></div>
      </div>
      <div className="row">
        {reviews && reviews.length > 0 ? (
          reviews.map(review => (
            <div key={review.id} className="review-card">
              <div className="review-container">
                Author: {review.author_nickname} — {review.stars} ⭐️
                <p className="m-0 border-0 review-box">
                  <span className="fa-solid fa-comment mx-2"></span>
                  {review.comment}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p>No comments yet.</p>
        )}
      </div>
    </div>
  );
};


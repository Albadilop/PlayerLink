import apiClient from './apiClient';
import type { CreateReviewRequest, ReviewResponse, ReviewsResponse } from '../types/api';

interface ReviewServices {
  getAllReviewsReceived: (user_id: number) => Promise<ReviewsResponse | Error>;
  postNewReview: (
    userAuthoredId: number,
    userReviewedId: number,
    reviewData: CreateReviewRequest
  ) => Promise<ReviewResponse>;
}

const reviewServices: ReviewServices = {
  getAllReviewsReceived: async (user_id: number): Promise<ReviewsResponse | Error> => {
    const response = await apiClient.get<ReviewsResponse>(`/api/reviews_received/${user_id}`, false);
    if (response.ok && response.data) {
      console.log(response.data);
      return response.data;
    }
    return new Error(response.error || "Something went wrong trying to get reviews info");
  },

  postNewReview: async (
    userAuthoredId: number,
    userReviewedId: number,
    reviewData: CreateReviewRequest
  ): Promise<ReviewResponse> => {
    const response = await apiClient.post<ReviewResponse>(
      `/api/reviews/${userAuthoredId}/${userReviewedId}`,
      reviewData,
      true
    );
    if (response.ok && response.data) {
      return response.data;
    }
    throw new Error(response.error || `Error posting review: ${response.status}`);
  },
};

export default reviewServices;



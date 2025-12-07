import apiClient from "./apiClient";
import type { CreateReviewRequest, ReviewResponse, ReviewsResponse } from "../types/api";

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
    console.log("reviewServices.getAllReviewsReceived: Calling endpoint for user_id:", user_id);
    const response = await apiClient.get<ReviewsResponse>(
      `/api/reviews_received/${user_id}`,
      false
    );
    console.log("reviewServices.getAllReviewsReceived: Response:", response);
    if (response.ok && response.data) {
      console.log("reviewServices.getAllReviewsReceived: Data received:", response.data);
      return response.data;
    }
    console.error(
      "reviewServices.getAllReviewsReceived: Error response:",
      response.error,
      response.status
    );
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

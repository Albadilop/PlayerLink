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
    try {
      const response = await apiClient.request<ReviewsResponse>(
        `/api/reviews_received/${user_id}`,
        {
          method: "GET",
          requiresAuth: false,
          retryCount: 2,
          retryDelay: 500,
        }
      );

      if (response.ok && response.data) {
        // Verificar que la estructura sea correcta
        if (
          response.data &&
          typeof response.data === "object" &&
          "reviews_received" in response.data
        ) {
          return response.data;
        } else {
          console.error(
            "reviewServices.getAllReviewsReceived: Invalid data structure:",
            response.data
          );
          return new Error("Invalid response structure from server");
        }
      }
      console.error(
        "reviewServices.getAllReviewsReceived: Error response:",
        response.error,
        response.status
      );
      return new Error(response.error || "Something went wrong trying to get reviews info");
    } catch (error) {
      console.error("reviewServices.getAllReviewsReceived: Exception caught:", error);
      return new Error(error instanceof Error ? error.message : "Unknown error loading reviews");
    }
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

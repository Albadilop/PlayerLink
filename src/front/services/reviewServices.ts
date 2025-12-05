import { normalizeUrl } from '../utils/urlHelper';
import type { CreateReviewRequest, ReviewResponse, ReviewsResponse } from '../types/api';

const url = import.meta.env.VITE_BACKEND_URL;

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
      const resp = await fetch(normalizeUrl(url, `/api/reviews_received/${user_id}`));
      if (!resp.ok)
        throw Error("Something went wrong trying to get reviews info");
      const data = await resp.json() as ReviewsResponse;
      console.log(data);
      return data;
    } catch (error) {
      console.log(error);
      return error as Error;
    }
  },

  postNewReview: async (
    userAuthoredId: number,
    userReviewedId: number,
    reviewData: CreateReviewRequest
  ): Promise<ReviewResponse> => {
    try {
      const resp = await fetch(
        normalizeUrl(url, `/api/reviews/${userAuthoredId}/${userReviewedId}`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reviewData),
        }
      );

      if (!resp.ok) {
        throw new Error(
          `Error posting review: ${resp.status} ${resp.statusText}`
        );
      }

      const result = await resp.json() as ReviewResponse;
      return result;
    } catch (error) {
      console.error("postNewReview:", error);
      throw error;
    }
  },
};

export default reviewServices;



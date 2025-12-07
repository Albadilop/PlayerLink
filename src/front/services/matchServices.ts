import apiClient from './apiClient';
import type { MatchesResponse } from '../types/api';

interface MatchServices {
  getAllMatchesInfo: (user_id: number) => Promise<MatchesResponse | Error>;
}

const matchServices: MatchServices = {
  getAllMatchesInfo: async (user_id: number): Promise<MatchesResponse | Error> => {
    const response = await apiClient.get<MatchesResponse>(`/api/matches/user/${user_id}`, false);
    if (response.ok && response.data) {
      return response.data;
    }
    return new Error(response.error || 'Something went wrong trying to get matches info');
  }
};

export default matchServices;



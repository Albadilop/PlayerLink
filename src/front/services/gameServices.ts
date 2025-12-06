import apiClient from './apiClient';
import type { CreateGameRequest, PostGameResponse, UpdateGameResponse, DeleteGameResponse } from '../types/api';

interface GameServices {
  postNewGame: (profileId: number, form: CreateGameRequest) => Promise<PostGameResponse>;
  deleteGameById: (game_id: number) => Promise<DeleteGameResponse>;
  updateGameInfo: (game_id: number, hours: number) => Promise<UpdateGameResponse>;
}

const gameServices: GameServices = {
  postNewGame: async (profileId: number, form: CreateGameRequest): Promise<PostGameResponse> => {
    const response = await apiClient.post<PostGameResponse>(
      `/api/games/${profileId}`,
      {
        title: form.title,
        hours_played: form.hours_played,
        image: form.image,
      },
      false
    );
    if (response.ok && response.data) {
      return response.data;
    }
    throw new Error(response.error || "Something went wrong trying to post game info");
  },

  deleteGameById: async (game_id: number): Promise<DeleteGameResponse> => {
    const response = await apiClient.delete<DeleteGameResponse>(`/api/games/${game_id}`, false);
    if (response.ok && response.data) {
      return response.data;
    }
    throw new Error(response.error || "Something went wrong trying to delete game");
  },

  updateGameInfo: async (game_id: number, hours: number): Promise<UpdateGameResponse> => {
    const response = await apiClient.put<UpdateGameResponse>(
      `/api/games/hours/${game_id}`,
      { hours_played: hours },
      false
    );
    if (response.ok && response.data) {
      return response.data;
    }
    throw new Error(response.error || "Something went wrong trying to update game");
  },
};

export default gameServices;



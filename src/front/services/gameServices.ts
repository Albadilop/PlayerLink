import apiClient from "./apiClient";
import type {
  CreateGameRequest,
  PostGameResponse,
  UpdateGameResponse,
  DeleteGameResponse,
} from "../types/api";

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
      true // Requiere autenticación - el endpoint tiene @jwt_required()
    );
    if (response.ok && response.data) {
      return response.data;
    }
    // Improve error message based on status code
    if (response.status === 404) {
      throw new Error(`Profile does not exist`);
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(`You do not have permission to add games to this profile`);
    }
    throw new Error(response.error || "Error adding game");
  },

  deleteGameById: async (game_id: number): Promise<DeleteGameResponse> => {
    const response = await apiClient.delete<DeleteGameResponse>(
      `/api/games/${game_id}`,
      true // Requiere autenticación - el endpoint tiene @jwt_required()
    );
    if (response.ok && response.data) {
      return response.data;
    }
    // Improve error message based on status code
    if (response.status === 404) {
      throw new Error(`Game does not exist or has already been deleted`);
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(`You do not have permission to delete this game`);
    }
    throw new Error(response.error || "Error deleting game");
  },

  updateGameInfo: async (game_id: number, hours: number): Promise<UpdateGameResponse> => {
    const response = await apiClient.put<UpdateGameResponse>(
      `/api/games/hours/${game_id}`,
      { hours_played: hours },
      true // Requiere autenticación - el endpoint tiene @jwt_required()
    );
    if (response.ok && response.data) {
      return response.data;
    }
    // Improve error message based on status code
    if (response.status === 404) {
      throw new Error(`Game does not exist or has already been deleted`);
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(`You do not have permission to update this game`);
    }
    throw new Error(response.error || "Error updating game hours");
  },
};

export default gameServices;

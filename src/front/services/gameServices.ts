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
      true  // Requiere autenticación - el endpoint tiene @jwt_required()
    );
    if (response.ok && response.data) {
      return response.data;
    }
    // Mejorar el mensaje de error según el código de estado
    if (response.status === 404) {
      throw new Error(`El perfil no existe`);
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(`No tienes permiso para agregar juegos a este perfil`);
    }
    throw new Error(response.error || "Error al intentar agregar el juego");
  },

  deleteGameById: async (game_id: number): Promise<DeleteGameResponse> => {
    const response = await apiClient.delete<DeleteGameResponse>(
      `/api/games/${game_id}`,
      true  // Requiere autenticación - el endpoint tiene @jwt_required()
    );
    if (response.ok && response.data) {
      return response.data;
    }
    // Mejorar el mensaje de error según el código de estado
    if (response.status === 404) {
      throw new Error(`El juego no existe o ya fue eliminado`);
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(`No tienes permiso para eliminar este juego`);
    }
    throw new Error(response.error || "Error al intentar eliminar el juego");
  },

  updateGameInfo: async (game_id: number, hours: number): Promise<UpdateGameResponse> => {
    const response = await apiClient.put<UpdateGameResponse>(
      `/api/games/hours/${game_id}`,
      { hours_played: hours },
      true  // Requiere autenticación - el endpoint tiene @jwt_required()
    );
    if (response.ok && response.data) {
      return response.data;
    }
    // Mejorar el mensaje de error según el código de estado
    if (response.status === 404) {
      throw new Error(`El juego no existe o ya fue eliminado`);
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(`No tienes permiso para actualizar este juego`);
    }
    throw new Error(response.error || "Error al intentar actualizar las horas del juego");
  },
};

export default gameServices;



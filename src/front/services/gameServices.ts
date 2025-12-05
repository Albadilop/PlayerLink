import { normalizeUrl } from '../utils/urlHelper';
import type { CreateGameRequest, PostGameResponse, UpdateGameResponse, DeleteGameResponse } from '../types/api';

const url = import.meta.env.VITE_BACKEND_URL;

interface GameServices {
  postNewGame: (profileId: number, form: CreateGameRequest) => Promise<PostGameResponse>;
  deleteGameById: (game_id: number) => Promise<DeleteGameResponse>;
  updateGameInfo: (game_id: number, hours: number) => Promise<UpdateGameResponse>;
}

const gameServices: GameServices = {
  postNewGame: async (profileId: number, form: CreateGameRequest): Promise<PostGameResponse> => {
    try {
      const resp = await fetch(normalizeUrl(url, `/api/games/${profileId}`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          hours_played: form.hours_played,
          image: form.image,
        }),
      });

      if (!resp.ok) {
        throw new Error("Something went wrong trying to post game info");
      }

      const data = await resp.json() as PostGameResponse;
      return data;
    } catch (error) {
      console.error("postNewGame error:", error);
      throw error;
    }
  },

  deleteGameById: async (game_id: number): Promise<DeleteGameResponse> => {
    try {
      const resp = await fetch(normalizeUrl(url, `/api/games/${game_id}`), {
        method: "DELETE",
      });

      if (!resp.ok) {
        throw new Error("Something went wrong trying to delete game");
      }
      const data = await resp.json() as DeleteGameResponse;
      return data;
    } catch (error) {
      console.error("deleteGameById error:", error);
      throw error;
    }
  },

  updateGameInfo: async (game_id: number, hours: number): Promise<UpdateGameResponse> => {
    try {
      const resp = await fetch(normalizeUrl(url, `/api/games/hours/${game_id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hours_played: hours,
        }),
      });

      if (!resp.ok) {
        throw new Error("Something went wrong trying to update game");
      }
      const data = await resp.json() as UpdateGameResponse;
      return data;
    } catch (error) {
      console.error("updateGameInfo error:", error);
      throw error;
    }
  },
};

export default gameServices;



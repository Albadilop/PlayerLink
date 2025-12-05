import { normalizeUrl } from '../utils/urlHelper';
import type { MatchesResponse } from '../types/api';

const url = import.meta.env.VITE_BACKEND_URL;

interface MatchServices {
  getAllMatchesInfo: (user_id: number) => Promise<MatchesResponse | Error>;
}

const matchServices: MatchServices = {
  getAllMatchesInfo: async (user_id: number): Promise<MatchesResponse | Error> => {
    try {
      const resp = await fetch(normalizeUrl(url, `/api/matches/user/${user_id}`));
      if (!resp.ok) throw Error('Something went wrong trying to get matches info');
      const data = await resp.json() as MatchesResponse;
      return data;
    } catch (error) {
      console.log(error);
      return error as Error;
    }
  }
};

export default matchServices;



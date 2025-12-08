import type { Store, Action } from "./types";

function safeJSONParse<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null || item === "undefined") return fallback;
    return JSON.parse(item) as T;
  } catch (e) {
    console.warn(`Error al parsear ${key}:`, e);
    return fallback;
  }
}

export const initialStore = (): Store => {
  return {
    user: safeJSONParse("user", null),
    userMatchesInfo: null,
    itsMatchInfo: safeJSONParse("itsMatchInfo", null),
    likesSent: safeJSONParse("likesSent", []),
    dislikesSent: safeJSONParse("dislikesSent", []),
    starsByUser: null,
    searchMatchProfiles: safeJSONParse("searchMatchProfiles", []),
    matchReviewsReceived: null,
  };
};

export default function storeReducer(
  store: Store,
  action: Action = { type: "getUserInfo" }
): Store {
  switch (action.type) {
    case "addMatch": {
      const updatedMatches = store.userMatchesInfo
        ? [...store.userMatchesInfo, action.payload as (typeof store.userMatchesInfo)[0]]
        : [action.payload as (typeof store.userMatchesInfo)[0]];
      localStorage.setItem("userMatchesInfo", JSON.stringify(updatedMatches));
      return {
        ...store,
        userMatchesInfo: updatedMatches,
      };
    }

    case "getSearchMatchProfilesFiltered":
      localStorage.setItem("searchMatchProfiles", JSON.stringify(action.payload));
      return {
        ...store,
        searchMatchProfiles: action.payload as Store["searchMatchProfiles"],
      };

    case "saveLike": {
      const updatedLikes = [...store.likesSent, action.payload as (typeof store.likesSent)[0]];
      localStorage.setItem("likesSent", JSON.stringify(updatedLikes));
      return {
        ...store,
        likesSent: updatedLikes,
      };
    }

    case "saveDislike": {
      const updatedDislikes = [
        ...store.dislikesSent,
        action.payload as (typeof store.dislikesSent)[0],
      ];
      localStorage.setItem("dislikesSent", JSON.stringify(updatedDislikes));
      return {
        ...store,
        dislikesSent: updatedDislikes,
      };
    }

    case "getSearchMatchProfiles":
      localStorage.setItem("searchMatchProfiles", JSON.stringify(action.payload));
      return {
        ...store,
        searchMatchProfiles: action.payload as Store["searchMatchProfiles"],
      };

    case "getStarsByUser":
      return {
        ...store,
        starsByUser: action.payload as number,
      };

    case "getItsMatchInfo":
      return {
        ...store,
        itsMatchInfo: action.payload as Store["itsMatchInfo"],
      };

    case "getAllMatchesInfo": {
      const matches = action.payload as Store["userMatchesInfo"];
      // Guardar en localStorage para persistencia
      if (matches) {
        localStorage.setItem("userMatchesInfo", JSON.stringify(matches));
      } else {
        localStorage.removeItem("userMatchesInfo");
      }
      return {
        ...store,
        userMatchesInfo: matches,
      };
    }

    case "logout":
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("likesSent");
      localStorage.removeItem("dislikesSent");
      localStorage.removeItem("searchMatchProfiles");
      localStorage.removeItem("profile");

      return {
        ...store,
        user: null,
        likesSent: [],
        dislikesSent: [],
        userMatchesInfo: null,
        starsByUser: null,
        searchMatchProfiles: [],
      };

    case "matchReviewsReceived":
      return {
        ...store,
        matchReviewsReceived: action.payload as Store["matchReviewsReceived"],
      };

    case "getUserInfo":
      // Guardar el usuario en localStorage también
      if (action.payload) {
        localStorage.setItem("user", JSON.stringify(action.payload));
      }
      return {
        ...store,
        user: action.payload as Store["user"],
      };

    default:
      return store;
  }
}

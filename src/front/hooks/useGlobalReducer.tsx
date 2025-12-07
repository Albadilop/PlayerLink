/* eslint-disable react-refresh/only-export-components */
import { useContext, useReducer, createContext, type ReactNode } from "react";
import storeReducer, { initialStore } from "../store";
import type { Store, Action } from "../types";

const StoreContext = createContext<
  { store: Store; dispatch: (action: Action) => void } | undefined
>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, dispatch] = useReducer(storeReducer, initialStore());
  return <StoreContext.Provider value={{ store, dispatch }}>{children}</StoreContext.Provider>;
}

export default function useGlobalReducer(): { dispatch: (action: Action) => void; store: Store } {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useGlobalReducer must be used within a StoreProvider");
  }
  const { dispatch, store } = context;
  return { dispatch, store };
}

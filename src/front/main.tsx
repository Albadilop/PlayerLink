import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { StoreProvider } from "./hooks/useGlobalReducer";
import { BackendURL } from "./components/BackendURL";

// Initialize theme on app load
const initializeTheme = () => {
  const savedTheme = localStorage.getItem("appTheme") || "dark";
  const body = document.body;
  if (savedTheme === "light") {
    body.classList.add("light-theme");
    body.classList.remove("dark-theme");
  } else {
    body.classList.add("dark-theme");
    body.classList.remove("light-theme");
  }
};

// Apply theme before rendering
initializeTheme();

// eslint-disable-next-line react-refresh/only-export-components
const Main: React.FC = () => {
  const viteBackend = (import.meta.env.VITE_BACKEND_URL ?? "").trim();
  if (viteBackend === "" && !import.meta.env.DEV) {
    return (
      <React.StrictMode>
        <BackendURL />
      </React.StrictMode>
    );
  }
  return (
    <React.StrictMode>
      <StoreProvider>
        <RouterProvider router={router} />
      </StoreProvider>
    </React.StrictMode>
  );
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(<Main />);

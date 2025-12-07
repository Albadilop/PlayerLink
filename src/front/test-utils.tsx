import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { StoreProvider } from "./hooks/useGlobalReducer";

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {}

// eslint-disable-next-line react-refresh/only-export-components
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <StoreProvider>{children}</StoreProvider>;
};

const customRender = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  return render(ui, {
    wrapper: ({ children }) => <AllTheProviders>{children}</AllTheProviders>,
    ...options,
  });
};

// eslint-disable-next-line react-refresh/only-export-components
export * from "@testing-library/react";
export { customRender as render };

import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { StoreProvider } from './hooks/useGlobalReducer';
import type { Store } from './types';
import { initialStore } from './store';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<Store>;
}

const AllTheProviders = ({ children, preloadedState }: { children: React.ReactNode; preloadedState?: Partial<Store> }) => {
  const store = { ...initialStore(), ...preloadedState };
  return (
    <StoreProvider>
      {children}
    </StoreProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { preloadedState, ...renderOptions } = options;
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders preloadedState={preloadedState}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

export * from '@testing-library/react';
export { customRender as render };



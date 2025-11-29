/**
 * Stub for OrchestrationContext
 * Backend services removed for frontend-only build
 */

import React, { createContext, useContext } from 'react';

const OrchestrationContext = createContext<any>(null);

export function OrchestrationProvider({ children }: { children: React.ReactNode }) {
  const stubEventBus = {
    on: () => {},
    off: () => {},
    emit: () => {},
    publish: (_event: string, _payload?: any) => {
      console.warn('[OrchestrationContext:eventBus] publish disabled in frontend-only mode');
    },
    subscribe: (_event: string, _callback: (data: any) => void) => {
      console.warn('[OrchestrationContext:eventBus] subscribe disabled in frontend-only mode');
      return {
        unsubscribe: () => {
          console.warn('[OrchestrationContext:eventBus] unsubscribe disabled in frontend-only mode');
        }
      };
    }
  };

  const value = {
    state: null,
    actions: {},
    isLoading: false,
    eventBus: stubEventBus,
    graphService: null,
    controller: null,
  };

  return <OrchestrationContext.Provider value={value}>{children}</OrchestrationContext.Provider>;
}

export function useOrchestration() {
  const ctx = useContext(OrchestrationContext);
  if (ctx) return ctx;

  // Fallback for components using the hook outside the provider
  const stubEventBus = {
    on: () => {},
    off: () => {},
    emit: () => {},
    publish: () => {},
    subscribe: () => ({ unsubscribe: () => {} }),
  };

  return {
    state: null,
    actions: {},
    isLoading: false,
    eventBus: stubEventBus,
    graphService: null,
    controller: null,
  };
}


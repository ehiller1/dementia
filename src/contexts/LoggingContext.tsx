import React, { createContext, useContext, useCallback } from 'react';

interface LoggingContextType {
  logLifecycle: (message: string, payload?: any) => void;
  logAction: (message: string, payload?: any) => void;
  logIntent: (message: string, payload?: any) => void;
  logPrompt: (message: string, payload?: any) => void;
  logMemory: (message: string, payload?: any) => void;
  logTemplate: (message: string, payload?: any) => void;
}

const LoggingContext = createContext<LoggingContextType | undefined>(undefined);

export const LoggingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const log = (source: string, message: string, payload: any = null) => {
    console.log(`[${source}] ${message}`, payload);
  };

  const logLifecycle = useCallback((message: string, payload: any = null) => log('Lifecycle', message, payload), []);
  const logAction = useCallback((message: string, payload: any = null) => log('Action', message, payload), []);
  const logIntent = useCallback((message: string, payload: any = null) => log('Intent', message, payload), []);
  const logMemory = useCallback((message: string, payload: any = null) => log('Memory', message, payload), []);
  const logPrompt = useCallback((message: string, payload: any = null) => log('Prompt', message, payload), []);
  const logTemplate = useCallback((message: string, payload: any = null) => log('Template', message, payload), []);

  const value = {
    logLifecycle,
    logAction,
    logIntent,
    logPrompt,
    logMemory,
    logTemplate,
  };

  return (
    <LoggingContext.Provider value={value}>
      {children}
    </LoggingContext.Provider>
  );
};

export const useLogging = () => {
  const context = useContext(LoggingContext);
  if (context === undefined) {
    throw new Error('useLogging must be used within a LoggingProvider');
  }
  return context;
};

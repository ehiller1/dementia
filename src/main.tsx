
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { initializeTemplateUpdater } from "./template/ReactiveTemplateUpdater";

// Import the TestResult type from the test file
import type { TestResult } from './tests/seasonality-agent-comprehensive-test';

// Declare global type for TypeScript first
declare global {
  interface Window {
    runSeasonalityAgentTests: () => Promise<TestResult[]>;
  }
}

// Initialize test functions in development
if (import.meta.env.DEV) {
  console.log('🔧 Initializing development test functions...');
  
  // Ensure window object exists and set up test function
  if (typeof window !== 'undefined') {
    // Set up the test function immediately
    window.runSeasonalityAgentTests = async () => {
      console.log('🔄 Loading test suite...');
      try {
        // DISABLED: Test module removed for frontend-only build
        console.warn('[main.tsx] Test module disabled - frontend-only mode');
        const testModule = null;
        // Get the actual test function
        if (testModule.default) {
          return await testModule.default();
        } else {
          console.error('No default export found in test module');
          return [];
        }
      } catch (error) {
        console.error('Failed to load or run test module:', error);
        return [];
      }
    };
    
    // Verify the function was set
    console.log('✅ Test function initialized!');
    console.log('Function type:', typeof window.runSeasonalityAgentTests);
    console.log('Use: await window.runSeasonalityAgentTests()');
  } else {
    console.error('❌ Window object not available');
  }
}

console.log('🚀 [main.tsx] Starting React app...');
console.log('🚀 [main.tsx] Root element:', document.getElementById("root"));

// Initialize template updater (will be wired to engine/loop when available)
// This sets up the listener infrastructure
console.log('📝 [main.tsx] Initializing template updater...');
// Note: Engine and signal queue will be passed when orchestration loop starts
// For now, just set up the listener infrastructure
console.log('✅ [main.tsx] Template updater infrastructure ready');

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('❌ [main.tsx] Root element not found!');
} else {
  console.log('✅ [main.tsx] Root element found, creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  console.log('✅ [main.tsx] React root created, rendering App...');
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  );
  console.log('✅ [main.tsx] App render called');
}

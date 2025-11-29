/**
 * Supabase Client Configuration
 * 
 * This module initializes and exports the Supabase client for use throughout the application.
 * Falls back to a safe no-op mock when environment variables are missing.
 */

import { createClient } from '@supabase/supabase-js';

// Note: Vite automatically loads .env files, so no need to manually load dotenv

// Initialize Supabase client with environment variables
// Support both Vite (import.meta.env) and Node (process.env)
const supabaseUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) 
  || (process as any).env?.VITE_SUPABASE_URL 
  || (process as any).env?.SUPABASE_URL 
  || '';
const supabaseKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) 
  || (process as any).env?.VITE_SUPABASE_ANON_KEY 
  || (process as any).env?.SUPABASE_ANON_KEY 
  || '';

// Safe mock client used when env vars are not configured (e.g., Vercel preview)
function createMockSupabase() {
  // Minimal mock to satisfy calls used in the app
  const noOp = async (..._args: any[]) => ({ data: null, error: null } as any);
  const noOpSub = { unsubscribe: () => {} };
  return {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: (_event: any, _cb?: any) => ({ data: { subscription: noOpSub } }),
      signInWithPassword: noOp,
      signUp: noOp,
      signInWithOtp: noOp,
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null } })
    },
    functions: {
      invoke: noOp
    },
    from: (_table: string) => ({
      select: (_q?: string) => ({ eq: noOp, order: noOp, limit: noOp, then: noOp } as any),
      insert: noOp,
      update: noOp,
      delete: noOp
    })
  } as any;
}

let client: any;

try {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[supabase] Missing env; using mock client (frontend-only mode)');
    client = createMockSupabase();
  } else {
    client = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: {
      'x-application-name': 'quest-agent-forge'
    }
  }
});
  }
} catch (e) {
  console.error('[supabase] Failed to initialize client, falling back to mock:', e);
  client = createMockSupabase();
}

export const supabase = client;

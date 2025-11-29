/**
 * Mock Supabase client for testing
 * This file provides a direct mock at the exact path expected by the tests
 */

// Export the mock supabase client
export const supabase = {
  from: (table) => ({
    select: (columns) => ({
      eq: (field, value) => ({
        single: () => Promise.resolve({ data: null, error: null }),
        order: (column, options) => ({
          limit: (limit) => Promise.resolve({ data: [], error: null }),
        }),
        limit: (limit) => Promise.resolve({ data: [], error: null }),
      }),
      order: (column, options) => ({
        limit: (limit) => Promise.resolve({ data: [], error: null }),
      }),
      limit: (limit) => Promise.resolve({ data: [], error: null }),
    }),
    insert: (data) => Promise.resolve({ data: { ...data, id: 'mock-id' }, error: null }),
    update: (data) => ({
      eq: (field, value) => Promise.resolve({ data: { ...data, id: value }, error: null }),
    }),
    delete: () => ({
      eq: (field, value) => Promise.resolve({ data: null, error: null }),
    }),
  }),
  storage: {
    from: (bucket) => ({
      upload: (path, file) => Promise.resolve({ data: { path }, error: null }),
      download: (path) => Promise.resolve({ data: new Uint8Array(), error: null }),
    }),
  },
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signUp: (credentials) => Promise.resolve({ data: { user: { id: 'mock-user-id' } }, error: null }),
    signIn: (credentials) => Promise.resolve({ data: { user: { id: 'mock-user-id' } }, error: null }),
    signInWithPassword: ({ email, password }) => Promise.resolve({ data: { user: { id: 'mock-user-id', email } }, error: null }),
    signInWithOtp: ({ email }) => Promise.resolve({ data: { user: { id: 'mock-user-id', email } }, error: null }),
    onAuthStateChange: (callback) => {
      // Immediately invoke callback with null session for tests/mocks
      try { callback('INITIAL', null); } catch {}
      return { data: { subscription: { unsubscribe: () => {} } }, error: null };
    },
    signOut: () => Promise.resolve({ error: null }),
  },
  rpc: (func, params) => Promise.resolve({ data: null, error: null }),
};

export default supabase;

/**
 * Stub for Supabase client
 * Backend services removed for frontend-only build
 */

// Create a chainable query builder stub that can be awaited
const createQueryBuilder = () => {
  const result = Promise.resolve({ data: [], error: null });
  
  const builder: any = {
    select: (columns?: string) => {
      console.warn('[Supabase Stub] select() disabled - frontend-only mode');
      return builder;
    },
    insert: (values: any) => {
      console.warn('[Supabase Stub] insert() disabled - frontend-only mode');
      return Promise.resolve({ data: null, error: null });
    },
    update: (values: any) => {
      console.warn('[Supabase Stub] update() disabled - frontend-only mode');
      return builder;
    },
    delete: () => {
      console.warn('[Supabase Stub] delete() disabled - frontend-only mode');
      return builder;
    },
    eq: (column: string, value: any) => {
      console.warn(`[Supabase Stub] eq('${column}') disabled - frontend-only mode`);
      return builder;
    },
    neq: (column: string, value: any) => {
      console.warn(`[Supabase Stub] neq('${column}') disabled - frontend-only mode`);
      return builder;
    },
    gt: (column: string, value: any) => {
      console.warn(`[Supabase Stub] gt('${column}') disabled - frontend-only mode`);
      return builder;
    },
    lt: (column: string, value: any) => {
      console.warn(`[Supabase Stub] lt('${column}') disabled - frontend-only mode`);
      return builder;
    },
    gte: (column: string, value: any) => {
      console.warn(`[Supabase Stub] gte('${column}') disabled - frontend-only mode`);
      return builder;
    },
    lte: (column: string, value: any) => {
      console.warn(`[Supabase Stub] lte('${column}') disabled - frontend-only mode`);
      return builder;
    },
    like: (column: string, pattern: string) => {
      console.warn(`[Supabase Stub] like('${column}') disabled - frontend-only mode`);
      return builder;
    },
    ilike: (column: string, pattern: string) => {
      console.warn(`[Supabase Stub] ilike('${column}') disabled - frontend-only mode`);
      return builder;
    },
    is: (column: string, value: any) => {
      console.warn(`[Supabase Stub] is('${column}') disabled - frontend-only mode`);
      return builder;
    },
    in: (column: string, values: any[]) => {
      console.warn(`[Supabase Stub] in('${column}') disabled - frontend-only mode`);
      return builder;
    },
    contains: (column: string, value: any) => {
      console.warn(`[Supabase Stub] contains('${column}') disabled - frontend-only mode`);
      return builder;
    },
    order: (column: string, options?: { ascending?: boolean }) => {
      console.warn(`[Supabase Stub] order('${column}') disabled - frontend-only mode`);
      return builder;
    },
    limit: (count: number) => {
      console.warn(`[Supabase Stub] limit(${count}) disabled - frontend-only mode`);
      return builder;
    },
    range: (from: number, to: number) => {
      console.warn(`[Supabase Stub] range(${from}, ${to}) disabled - frontend-only mode`);
      return builder;
    },
    single: () => {
      console.warn('[Supabase Stub] single() disabled - frontend-only mode');
      return Promise.resolve({ data: null, error: null });
    },
  };
  
  // Make the builder thenable so it can be awaited
  builder.then = result.then.bind(result);
  builder.catch = result.catch.bind(result);
  builder.finally = result.finally.bind(result);
  
  return builder;
};

export const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
    signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => {
            console.warn('[Supabase Stub] Auth state change subscription disabled - frontend-only mode');
          }
        }
      }
    }),
  },
  from: (table: string) => {
    console.warn(`[Supabase Stub] from('${table}') disabled - frontend-only mode`);
    return createQueryBuilder();
  },
} as any;


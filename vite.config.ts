import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    define: {
      'process.env': {
        VITE_SUPABASE_URL: JSON.stringify(env.VITE_SUPABASE_URL),
        VITE_SUPABASE_ANON_KEY: JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
        VITE_OPENAI_API_KEY: JSON.stringify(env.VITE_OPENAI_API_KEY)
      },
      'import.meta.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || env.VITE_SUPABASE_URL),
      'import.meta.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY)
    },
    optimizeDeps: {
      exclude: ['ioredis'], // Exclude server-only dependencies
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        // Stub out server-only modules for browser
        'ioredis': path.resolve(__dirname, './src/lib/stubs/ioredis-stub.ts'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000, // Increase chunk size warning limit to 1000kb
      rollupOptions: {
        external: [], // Don't mark as external, use stub instead
      },
      // Ensure proper base path for Vercel deployment
      base: '/',
    },
    server: {
      host: "::",
      port: 5173,
      proxy: {
        // Proxy API requests to the new backend server
        '/api': {
          target: 'https://picked-narwhal-trusty.ngrok-free.app',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('🔴 [Vite Proxy] Error:', err.message);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('🔵 [Vite Proxy] Request:', req.method, req.url, '→ https://picked-narwhal-trusty.ngrok-free.app');
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('🟢 [Vite Proxy] Response:', proxyRes.statusCode, req.url);
            });
          },
        },
        // WebSocket proxy for dev: /ws → backend WS
        '/ws': {
          target: 'wss://picked-narwhal-trusty.ngrok-free.app',
          ws: true,
          changeOrigin: true,
          secure: false,
        },
        // Proxy Supabase requests (optional) - can be removed if unused
        '/supabase': {
          target: 'https://picked-narwhal-trusty.ngrok-free.app',
          changeOrigin: true,
          secure: false,
        },
        // Proxy Supabase Edge Functions (optional)
        '/functions': {
          target: 'https://picked-narwhal-trusty.ngrok-free.app',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    // Environment variables are now exposed through the define section above
  };
});

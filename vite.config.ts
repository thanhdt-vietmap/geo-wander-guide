
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Replace process.env with empty object in production
    ...(mode === 'production' && {
      'process.env': JSON.stringify({}),
      'import.meta.env.VITE_VIETMAP_API_KEY': JSON.stringify(''),
      'import.meta.env.VITE_VIETMAP_BASE_URL': JSON.stringify(''),
      'import.meta.env.VITE_HMAC_SECRET': JSON.stringify(''),
      'import.meta.env.VITE_FOCUS_COORDINATES': JSON.stringify('')
    })
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn', 'console.error'],
        passes: 3,
        unsafe: true,
        unsafe_comps: true,
        unsafe_Function: true,
        unsafe_math: true,
        unsafe_symbols: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true,
        sequences: true,
        dead_code: true,
        evaluate: true,
        if_return: true,
        join_vars: true,
        reduce_vars: true,
        warnings: false
      },
      // mangle: {
      //   toplevel: true,
      //   eval: true,
      //   keep_fnames: false,
      //   properties: {
      //     regex: /^[a-zA-Z_$][a-zA-Z0-9_$]*$/
      //   }
      // },
      format: {
        comments: false,
        beautify: false,
        ecma: 2020
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['crypto-js']
        },
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]'
      }
    },
    target: 'es2020',
    sourcemap: false
  },
  esbuild: {
    legalComments: 'none',
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    treeShaking: true
  }
}));

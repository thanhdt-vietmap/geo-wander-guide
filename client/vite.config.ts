import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:5005',
        changeOrigin: true,
      },
    },
    headers: {
      'Content-Security-Policy': 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co;" +
        "worker-src 'self' blob:; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        // "connect-src 'self' https:; " +
        "font-src 'self' data:;" +
        "connect-src 'self' http://localhost:5005 https:;"
    }
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    ...(mode === "production" && {
      "process.env": JSON.stringify({}),
    }),
  },
  build: {
    minify: mode === "production" ? "terser" : false,
    ...(mode === "production" && {
      terserOptions: {
        compress: {
          drop_console: false, // hoặc false nếu bạn muốn giữ console
          drop_debugger: false,
          pure_funcs: ["console.info", "console.debug", "console.warn"],
          passes: 2,
          // Bỏ các unsafe_* để tránh làm hỏng chuỗi rgba()
          // unsafe: false,
          // unsafe_comps: false,
          // unsafe_Function: false,
          // unsafe_math: false,
          // unsafe_symbols: false,
          // unsafe_methods: false,
          // unsafe_proto: false,
          // unsafe_regexp: false,
          // unsafe_undefined: false,
          sequences: true,
          dead_code: true,
          evaluate: true,
          if_return: true,
          join_vars: true,
          reduce_vars: true,
          warnings: false,
        },
        format: {
          comments: false,
          beautify: false,
          ecma: 2020,
        },
      },
    }),
    rollupOptions: {
      output: {
        manualChunks(id) {
          // vendor: ["react", "react-dom"],
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          // utils: ["crypto-js"],
        },
        entryFileNames: "[name]-[hash].js",
        chunkFileNames: "[name]-[hash].js",
        assetFileNames: "[name]-[hash].[ext]",
      },
    },
    target: "es2020",
    sourcemap: mode === "development",
  },
  esbuild: {
    legalComments: "none",
    minifyIdentifiers: mode === "production",
    minifySyntax: mode === "production",
    minifyWhitespace: mode === "production",
    treeShaking: true,
  },
}));

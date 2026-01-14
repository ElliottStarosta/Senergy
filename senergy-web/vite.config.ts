import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: '127.0.0.1',
      // Only use proxy in development
      proxy: mode === 'development' ? {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          // Don't rewrite the path - keep /api prefix
          // rewrite: (path) => path.replace(/^\/api/, '')
        }
      } : undefined
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild'
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    base: '/'
  }
})
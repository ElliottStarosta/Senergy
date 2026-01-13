import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  server: {
    port: 3001,
    middlewareMode: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  define: {
    'process.env': process.env
  }
})
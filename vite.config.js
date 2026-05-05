import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    exclude: ['monaco-editor']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('monaco-editor')) return 'monaco'
        }
      }
    }
  }
})

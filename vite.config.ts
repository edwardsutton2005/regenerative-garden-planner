import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Two pages: the landing page at / and the planner at /plan/.
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        plan: 'plan/index.html',
      },
    },
  },
  test: {
    environment: 'node',
  },
})

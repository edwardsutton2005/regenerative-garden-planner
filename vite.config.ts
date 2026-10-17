import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Three pages: the landing page at /, the planner at /plan/, and the
  // privacy page at /privacy/.
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        plan: 'plan/index.html',
        privacy: 'privacy/index.html',
      },
    },
  },
  test: {
    environment: 'node',
  },
})

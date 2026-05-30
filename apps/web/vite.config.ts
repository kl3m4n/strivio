import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  ssr: {
    // Keep the Convex BetterAuth adapter external. Bundling it rewrites its
    // dynamic import of @tanstack/react-start/server to the app server entry,
    // which does not export getRequestHeaders in the Vercel SSR bundle.
    external: ['@convex-dev/better-auth'],
  },
  plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
})

export default config

import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  ssr: {
    // Keep the Convex BetterAuth adapter external. Bundling it rewrites its
    // dynamic import of @tanstack/react-start/server to the app server entry,
    // which does not export getRequestHeaders in the Vercel SSR bundle.
    external: ['@convex-dev/better-auth'],
  },
  // nitro génère la fonction serverless + .vercel/output (auto-détecté sur
  // Vercel). Sans lui, le build ne produit que dist/ et Vercel ne trouve pas
  // la sortie ("No Output Directory").
  plugins: [devtools(), tailwindcss(), tanstackStart(), nitro(), viteReact()],
})

export default config

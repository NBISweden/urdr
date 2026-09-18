import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const gitBranch = process.env.GIT_BRANCH
const gitHash = process.env.GIT_HASH

export default defineConfig({
  plugins: [react()],
  // Not the default node_modules/.vite: in the development container that path
  // is an empty root-owned volume (see docker-compose.yml), which vite cannot
  // write its pre-bundled dependencies to.
  cacheDir: '.vite-cache',
  // The app reads these as `process.env.*`, so they are substituted the same
  // way the webpack DefinePlugin used to do it. Values come from build args
  // (production/Dockerfile.nginx) or from urdr.env in development.
  define: {
    'process.env.PUBLIC_API_URL': JSON.stringify(process.env.PUBLIC_API_URL),
    'process.env.PUBLIC_REDMINE_URL': JSON.stringify(
      process.env.PUBLIC_REDMINE_URL
    ),
    'process.env.GIT_BRANCH': JSON.stringify(gitBranch),
    'process.env.GIT_HASH': JSON.stringify(gitHash)
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    assetsDir: 'assets',
    rolldownOptions: {
      output: {
        // Give every sizeable dependency its own chunk, so that bumping one
        // library does not invalidate the cache for all of them. This mirrors
        // the splitChunks rule the webpack build used to have.
        codeSplitting: {
          groups: [
            {
              name: (moduleId: string) => {
                const match = /node_modules\/(?:(@[^/]+)\/)?([^/]+)/.exec(
                  moduleId
                )
                if (!match) return null
                const scope = match[1] ? `${match[1].slice(1)}-` : ''
                return `vendor-${scope}${match[2]}`
              },
              minSize: 80 * 1024
            }
          ]
        }
      }
    }
  },
  server: {
    host: true,
    port: 4242,
    strictPort: true,
    allowedHosts: true,
    // The dev server is reached through the nginx container on port 4567,
    // so the HMR client has to be told where to open its websocket.
    hmr: {
      path: '/ws',
      clientPort: 4567
    }
  }
})
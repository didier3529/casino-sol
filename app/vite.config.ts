import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Include polyfills for Buffer, process, etc.
      include: ['buffer', 'process', 'util', 'stream', 'events'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      buffer: 'buffer',
      // Disable Wallet Standard auto-injection by aliasing to a shim
      '@solana/wallet-standard-wallet-adapter-react': resolve(__dirname, './src/shims/useStandardWalletAdapters.ts'),
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
})


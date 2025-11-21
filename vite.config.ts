/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
    injectRegister: false,

    pwaAssets: {
      disabled: false,
      config: true,
    },

    manifest: {
      name: 'MindEase - Mental Health & Wellness',
      short_name: 'MindEase',
      description: 'Your companion for mental health and wellness. Track your mood, connect with therapists, and get personalized recommendations.',
      theme_color: '#14b8a6',
      background_color: '#ffffff',
      display: 'standalone',
      scope: '/',
      start_url: '/',
      orientation: 'portrait',
    },

    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico,jpg,jpeg,webp}'],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      skipWaiting: true,
    },

    devOptions: {
      enabled: true,
      navigateFallback: 'index.html',
      suppressWarnings: true,
      type: 'module',
    },
    })
  ],
  // @ts-expect-error - test is from vitest/config but definedConfig is from vite
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/main.tsx',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/__tests__/**',
      ],
      thresholds: {
        branches: 50,
        functions: 50,
        lines: 50,
        statements: 50,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    allowedHosts: ['https://bef0b5aee3b2.ngrok-free.app', 'bef0b5aee3b2.ngrok-free.app'] 
  },
})

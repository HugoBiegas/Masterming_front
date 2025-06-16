/// <reference types="vite/client" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],

    // Résolution des chemins (pour vos imports @/)
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            '@/components': resolve(__dirname, './src/components'),
            '@/pages': resolve(__dirname, './src/pages'),
            '@/services': resolve(__dirname, './src/services'),
            '@/types': resolve(__dirname, './src/types'),
            '@/utils': resolve(__dirname, './src/utils'),
            '@/hooks': resolve(__dirname, './src/hooks'),
            '@/contexts': resolve(__dirname, './src/contexts')
        }
    },

    // Configuration CSS pour PostCSS et Tailwind
    css: {
        postcss: './postcss.config.js',
    },

    // Variables d'environnement sécurisées
    envPrefix: 'VITE_',

    // Configuration du serveur de développement
    server: {
        port: 3000,
        host: true,
        strictPort: true,
        open: true
    },

    // Le dossier public pour les assets statiques
    publicDir: 'public',

    // Configuration de build pour la production
    build: {
        outDir: 'dist',
        target: 'es2022',
        minify: 'esbuild',
        sourcemap: false,

        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    router: ['react-router-dom'],
                    utils: ['axios']
                }
            }
        },

        assetsInlineLimit: 4096,
        chunkSizeWarningLimit: 1000,
        reportCompressedSize: true
    },

    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', 'axios']
    }
})
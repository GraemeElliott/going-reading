import path from 'path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import tailwind from 'tailwindcss';
import autoprefixer from 'autoprefixer';
export default defineConfig({
    css: {
        postcss: {
            plugins: [tailwind(), autoprefixer()],
        },
    },
    plugins: [vue()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        proxy: {
            '/api/books': {
                target: 'https://api2.isbndb.com',
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/api/, ''); },
            },
        },
    },
});
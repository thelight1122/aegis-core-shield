import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    root: path.join(__dirname, 'src', 'renderer'),
    base: './', // Use relative paths for Electron
    build: {
        outDir: path.join(__dirname, 'dist', 'renderer'),
        emptyOutDir: true,
        rollupOptions: {
            input: path.join(__dirname, 'src', 'renderer', 'index.html')
        }
    },
    server: {
        port: 3000,
        strictPort: true
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
});

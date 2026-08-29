import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // 폰에서 QR 스캔 테스트를 하려면 같은 네트워크에서 접속할 수 있어야 한다.
    host: true,
    proxy: {
      // VITE_API_MODE=live 일 때 백엔드(Spring, 8080)로 넘긴다.
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/ws': { target: 'http://localhost:8080', ws: true, changeOrigin: true },
    },
  },
})

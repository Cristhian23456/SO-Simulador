import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base relativa: permite publicar en GitHub Pages sin configurar rutas
export default defineConfig({
  base: './',
  plugins: [react()],
})

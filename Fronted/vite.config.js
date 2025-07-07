import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
proxy: {
  '/analyze': 'http://localhost:3000',
  '/download': 'http://localhost:3000',
  '/email': 'http://localhost:3000',
  '/output': 'http://localhost:3000'

}
  }
});
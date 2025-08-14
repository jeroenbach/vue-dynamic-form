import { fileURLToPath, URL } from "node:url";

import { defineConfig } from 'vite';
import vueDevTools from "vite-plugin-vue-devtools";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("../", import.meta.url)),
      "~": fileURLToPath(new URL("../", import.meta.url)),
    },
  }});

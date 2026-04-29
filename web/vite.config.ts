import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  preview: {
    allowedHosts: ["acp-verifier-production.up.railway.app", "areweacpyet.com"],
  },
});

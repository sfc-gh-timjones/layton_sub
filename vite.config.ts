import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // GitHub project pages: set VITE_BASE=/your-repo-name/ in the deploy workflow.
  base: process.env.VITE_BASE || "/",
  server: { port: 5176, open: true },
});

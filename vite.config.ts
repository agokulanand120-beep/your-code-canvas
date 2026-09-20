import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import svgr from "vite-plugin-svgr";
import { prerenderStaticRoutes } from "./vite.prerender";

const spa404Fallback = () => ({
  name: "spa-404-fallback",
  closeBundle() {
    const indexPath = path.resolve(__dirname, "dist/index.html");
    const fallbackPath = path.resolve(__dirname, "dist/404.html");

    if (fs.existsSync(indexPath)) {
      fs.copyFileSync(indexPath, fallbackPath);
    }
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    svgr(), // 👈 ADD THIS
    prerenderStaticRoutes(),
    spa404Fallback(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const staticDirectories = ["Images", "assets"];

export default defineConfig({
  publicDir: false,
  plugins: [{
    name: "copy-static-site-directories",
    async closeBundle() {
      for (const directory of staticDirectories) {
        const source = resolve(process.cwd(), directory);
        const destination = resolve(process.cwd(), "dist", directory);
        try {
          await mkdir(destination, { recursive: true });
          await cp(source, destination, { recursive: true, force: true });
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
      }
    }
  }]
});

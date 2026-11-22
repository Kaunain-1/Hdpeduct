import { cp, mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";

const staticDirectories = ["Images", "assets"];

function parseEnvDefaults(source) {
  const values = {};
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    const value = match[2];
    values[match[1]] = value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")
      ? value.slice(1, -1)
      : value;
  }
  return values;
}

export default defineConfig(async ({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), "VITE_");
  const exampleEnv = parseEnvDefaults(await readFile(resolve(process.cwd(), ".env.example"), "utf8"));
  const getPublicConfig = name => process.env[name] || fileEnv[name] || exampleEnv[name] || "";

  return {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(getPublicConfig("VITE_SUPABASE_URL")),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(getPublicConfig("VITE_SUPABASE_PUBLISHABLE_KEY"))
    },
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
  };
});

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Les tests partagent les mêmes chemins « @/… » que l'application, pour qu'un
// test puisse rendre un composant réel au lieu d'en recopier une version
// simplifiée qui finirait par mentir.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  esbuild: { jsx: "automatic" },
  test: { environment: "node" },
});

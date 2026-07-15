import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "react-native": fileURLToPath(
        new URL("./test/react-native.ts", import.meta.url),
      ),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  ssr: {
    noExternal: ["@testing-library/react-native"],
  },
  test: {
    environment: "node",
    deps: {
      optimizer: {
        ssr: {
          enabled: true,
          include: ["@testing-library/react-native"],
        },
      },
    },
  },
});

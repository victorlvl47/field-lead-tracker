import { defineConfig } from "vitest/config";

export default defineConfig({
  ssr: {
    noExternal: ["@testing-library/react-native"],
  },
  test: {
    globals: true,
    alias: [
      {
        find: /^react-native$/,
        replacement: new URL("./test/react-native.ts", import.meta.url).pathname,
      },
    ],
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

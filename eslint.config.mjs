import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/**", "dist/**", "out/**", "build/**"],
  },

  // Main process & preload — Node.js CommonJS
  {
    files: ["src/main/**/*.js", "src/preload/**/*.js", "src/utils/**/*.js", "scripts/**/*.js"],
    ...js.configs.recommended,
    languageOptions: {
      globals: { ...globals.node },
      ecmaVersion: 2022,
      sourceType: "commonjs",
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
    },
  },

  // Renderer — browser environment
  {
    files: ["src/renderer/**/*.js"],
    ...js.configs.recommended,
    languageOptions: {
      globals: { ...globals.browser },
      ecmaVersion: 2022,
      sourceType: "script",
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "warn",
    },
  },
];

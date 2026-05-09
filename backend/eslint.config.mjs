import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Base JS rules
  js.configs.recommended,

  // Backend (Node.js)
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: globals.node,
      sourceType: "commonjs"
    }
  },

  // Jest test files
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest
      }
    }
  }
]);

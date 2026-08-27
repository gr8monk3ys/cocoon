import js from "@eslint/js";
import parser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["dist"] },
  js.configs.recommended,
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly"
      }
    }
  },
  {
    files: ["src/**/*.{ts,tsx}", "e2e/**/*.ts", "*.config.ts"],
    languageOptions: {
      parser,
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        chrome: "readonly",
        document: "readonly",
        window: "readonly",
        HTMLStyleElement: "readonly",
        HTMLDivElement: "readonly",
        HTMLButtonElement: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "no-undef": "off",
      "react-refresh/only-export-components": "off"
    }
  }
];

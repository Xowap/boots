import js from "@eslint/js";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import security from "eslint-plugin-security";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import svelte from "eslint-plugin-svelte";
import globals from "globals";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
    js.configs.recommended,
    ...svelte.configs["flat/recommended"],
    prettier,
    {
        files: ["**/*.ts", "**/*.js", "**/*.svelte"],
        plugins: {
            "@typescript-eslint": ts,
            "simple-import-sort": simpleImportSort,
            import: importPlugin,
            security: security,
        },
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                sourceType: "module",
                ecmaVersion: 2020,
                extraFileExtensions: [".svelte"],
            },
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        rules: {
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",
            "import/first": "error",
            "import/newline-after-import": "error",
            "import/no-duplicates": "error",
            ...security.configs.recommended.rules,
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_" },
            ],
        },
    },
    {
        files: ["**/*.svelte"],
        languageOptions: {
            parser: svelte.parser,
            parserOptions: {
                parser: tsParser,
            },
        },
    },
];

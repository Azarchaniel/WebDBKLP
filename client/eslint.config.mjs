import typeScriptEsLintPlugin from "@typescript-eslint/eslint-plugin";
import esLintConfigPrettier from "eslint-config-prettier";
import {FlatCompat} from "@eslint/eslintrc";
import path from "path";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Translate ESLintRC-style configs into flat configs.
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: typeScriptEsLintPlugin.configs["recommended"],
});

export default [
	// ESLint recommended flat config.
	"eslint:recommended",

	// Flat config for parsing TypeScript files. Includes rules for TypeScript.
	...compat.config({
		env: {node: true},
		extends: ["plugin:@typescript-eslint/recommended"],
		parser: "@typescript-eslint/parser",
		parserOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
		},
		plugins: ["@typescript-eslint"],
		rules: {
			"@typescript-eslint/no-unused-vars": "error",
			"@typescript-eslint/no-empty-interface": "error",
			"@typescript-eslint/no-explicit-any": "off" //TODO: for now, but I should fix those
		},
	}),

	// Flat config for turning off all rules that are unnecessary or might conflict with Prettier.
	esLintConfigPrettier,

	// Flat config for ESLint rules.
	{
		rules: {
			camelcase: ["error", {ignoreDestructuring: true}],
			quotes: ["error", "double"],
			indent: ["error", "tab", { "SwitchCase": 1 }]
		},
	},
	{
		ignores: [
			"src/styles/font-awesome/",
			"src/components/SearchAutocomplete.tsx"
		]
	}
];
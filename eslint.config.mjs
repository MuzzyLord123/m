import next from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

/**
 * ESLint flat config.
 *
 * `npm run lint` used to hang: the script called `next lint` while ESLint was
 * not installed and no config existed, so it dropped into an interactive
 * "which config would you like?" prompt that never returns in CI or in a
 * non-interactive shell. A broken script in a hand-over is worse than no
 * script, because the client runs it once and concludes the build is broken.
 *
 * Composed from the plugins' own flat configs rather than through FlatCompat —
 * the compat shim cannot serialise eslint-config-next under ESLint 9 and dies
 * with a circular-structure error before it lints anything.
 *
 * Scope: the React and Next mistakes that become runtime bugs. The audits in
 * scripts/ are the real quality gate on this project and they check behaviour,
 * so nothing here argues about formatting.
 */
export default [
  { ignores: [".next/**", "node_modules/**", "public/**", "scripts/**", "next-env.d.ts"] },
  ...tseslint.configs.recommended,
  {
    plugins: { "@next/next": next },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];

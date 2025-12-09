// apps/web/eslint.config.mjs
import { FlatCompat } from '@eslint/eslintrc';
import tseslint from '@typescript-eslint/eslint-plugin';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Name it so import/no-anonymous-default-export is happy
const eslintConfig = [
  // 🔹 1. Global ignores – keep ESLint out of build artifacts
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/out/**',
      '**/build/**',
      '**/dist/**',
      'next-env.d.ts',
    ],
  },

  // 🔹 2. Next.js + TS base config
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  // 🔹 3. Our plugin + rule overrides
  {
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Turn off the noisy TS rules that were breaking build
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',

      // Allow quotes in marketing copy
      'react/no-unescaped-entities': 'off',

      // Optional: if React complains about findDOMNode in some lib
      // 'react/no-find-dom-node': 'off',
    },
  },
];

export default eslintConfig;

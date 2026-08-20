import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

/**
 * Flat config. ESLint 9 (pinned by Next 16) dropped `.eslintrc`, and
 * `eslint-config-next` 16 ships native flat exports — so no FlatCompat shim.
 */
const config = [
  ...coreWebVitals,
  ...typescript,
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
];

export default config;

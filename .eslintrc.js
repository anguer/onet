// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaults = require('@crazejs/lint').eslint;

module.exports = {
  ...defaults,
  parserOptions: {
    project: 'tsconfig.eslint.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  ignorePatterns: ['node_modules', 'dist', 'build', 'build-templates', 'extensions', 'env.d.ts'],
  rules: {
    '@typescript-eslint/no-this-alias': 'off',
  },
};

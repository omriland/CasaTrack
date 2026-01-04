module.exports = {
  // Run ESLint and Prettier in parallel for TypeScript files
  '*.{ts,tsx}': ['eslint --fix --max-warnings=0', 'prettier --write'],
  // Format other files
  '*.{json,md,yml,yaml,js,mjs}': ['prettier --write'],
  // Ignore large files that don't need formatting
  '*.{png,jpg,jpeg,gif,svg,woff,woff2,ttf,eot}': () => [],
}

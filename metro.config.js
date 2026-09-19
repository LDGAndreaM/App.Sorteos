// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The `xlsx` package (used to export raffles to .xlsx) references Node's `fs`
// and `stream` modules behind runtime feature checks that never execute on
// React Native, but Metro still needs to resolve those require() calls when
// building the dependency graph. Point them at a no-op stub.
const emptyModulePath = require.resolve('./src/polyfills/empty-module.js');
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  fs: emptyModulePath,
  stream: emptyModulePath,
};

module.exports = config;

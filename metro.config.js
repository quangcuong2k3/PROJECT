const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');
// This is the new line you should add in, after the previous lines
config.resolver.unstable_enablePackageExports = false;
module.exports = config;

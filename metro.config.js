const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('wasm');
// SQLite's web worker requires SharedArrayBuffer. Native apps need no extra headers.
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    return middleware(req, res, next);
  },
};
module.exports = config;

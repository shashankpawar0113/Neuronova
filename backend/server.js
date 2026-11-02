// Vercel Express service entrypoint
const serverModule = require('./dist/server.js');
const app = serverModule.default || serverModule.app || serverModule;

module.exports = app;
module.exports.default = app;
module.exports.app = app;

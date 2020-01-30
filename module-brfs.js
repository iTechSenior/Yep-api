const brfs = require('brfs');

module.exports = function moduleBrfs(resource) {
  return brfs(resource, {
    parserOpts: {
      sourceType: 'module',
    },
  });
};

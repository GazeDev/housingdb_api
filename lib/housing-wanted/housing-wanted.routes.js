module.exports = {
  routes: (models) => {
    const controllers = require('./housing-wanted.controllers')(models);
    const housingWantedModels = require('./housing-wanted.models');
    return [];
  },
};

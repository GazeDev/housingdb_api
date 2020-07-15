module.exports = {
  routes: (models) => {
    const controllers = require('./external-housing-available.controllers')(models);
    const externalHousingAvailableModels = require('./external-housing-available.models');
    return [
    ];
  },
};

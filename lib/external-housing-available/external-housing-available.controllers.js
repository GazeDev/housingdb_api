module.exports = (models) => {
  const Boom = require('boom');
  const Sequelize = require('sequelize');
  const externalHousingAvailableModels = require('./external-housing-available.models');
  return {
    postExternalHousingAvailable: async function(request, h) {
      /*
        # Require Account for submitting fields, and location
      */
    }
  };
};

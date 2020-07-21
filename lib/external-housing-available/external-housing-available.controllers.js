module.exports = (models) => {
  const Boom = require('boom');
  const Sequelize = require('sequelize');
  const externalHousingAvailableModels = require('./external-housing-available.models');
  return {
    postExternalHousingAvailable: async function(request, h) {
      /*
        # Require Account for submitting fields, and location. 
        # Account also must be SUPER_ADMIN
      */
      let account;
      try {
        account = await accountLib.getAccount(request.auth.credentials);
      } catch (e) {
        throw Boom.badImplementation('Error during getAccount(request.auth.credentials).' + e);
      }

      if (account === null) {
        throw Boom.badRequest('Must have an Account to post an External Housing Avaliable');
      }

      if (process.env.SUPER_ADMIN !== request.auth.credentials.subjectId) {
        throw Boom.forbidden('Must be an Admin Account to post an External Housing Avaliable');
      }

      let externalHousingAvailableObject = {

      }
    }
  };
};

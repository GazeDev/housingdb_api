module.exports = (models) => {
    const Boom = require('boom');
    const Sequelize = require('sequelize');
    const Op = Sequelize.Op;
    const housingWantedModels = require('./housing-wanted.models');
  
    return {
      postHousingWanted: async function(request, h){
        /*
          # Require Account for submitting fields other than address
        */
        let account;
        let payload = request.payload;
        let payloadKeys = Object.keys(payload);
        if (payloadKeys.length !== 1 || payloadKeys[0] !== 'address') {
          let noAuth;
          try {
            if (request.auth.credentials) {
              account = await accountLib.getAccount(request.auth.credentials);
            } else {
              noAuth = true;
            }
          } catch (e) {
            throw Boom.badImplementation('Error during getAccount(request.auth.credentials). ' + e);
          }

          if (account === null || noAuth) {
            // User doesn't have an account, operation not allowed
            throw Boom.badRequest('Must have an Account to create a Property with any field other than address');
          }
        }

      }
    }
  
  };
module.exports = (models) => {
    const Boom = require('boom');
    const Sequelize = require('sequelize');
    const Op = Sequelize.Op;
    const housingWantedModels = require('./housing-wanted.models');
    const accountLib = require('../account/account.controllers')(models).lib;
    const locationLib = require('../location/location.controllers')(models).lib;
  
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

        /* Restrict AuthorId to same user, or SuperAdmin */
        if (payload.AuthorId) {
          // If AuthorId is set then we have already passed auth and account lookup
          // This is because if AuthorId is set then not only quickInfo is set
          if (
            payload.AuthorId !== account.id  &&
            request.auth.credentials.subjectId !== process.env.SUPER_ADMIN
          ) {
            throw Boom.badRequest('Property.AuthorId must match your Account ID or you must be a Super Admin');
          }
        }

        // bathrooms validation
      let hasBathrooms = false;
      let bathrooms = Number(request.payload.bathrooms);
      if (bathrooms) {
        hasBathrooms = true;
      }

      // number of bathrooms should be set
      if (!bothDefined(bathrooms)) {
        throw Boom.badData('bathrooms must be set');
      }

      // min should be less than max
      // if (hasBathrooms && (bathroomsMin > bathroomsMax)) {
      //   throw Boom.badData('bathroomsMin should be less than bathroomsMax');
      // }

      // bathrooms can be in .25 increments
      if (hasBathrooms &&
        (
          !bathroomsValidIncrement(bathrooms)
        )
      ) {
        throw Boom.badData('bathrooms must be in .25 increments');
      }

      // bedrooms validation
      let hasBedrooms = false;
      let bedrooms = request.payload.bedrooms;
      if (bedrooms) {
        hasBedrooms = true;
      }

      // number of bedrooms should be set
      if (!bothDefined(bedrooms)) {
        throw Boom.badData('number of bedrooms must be set');
      }

      // min should be less than max
      // if (hasBedrooms && (bedroomsMin > bedroomsMax)) {
      //   throw Boom.badData('bedroomsMin should be less than bedroomsMax');
      // }

      }
    }
  
  };
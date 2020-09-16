module.exports = (models) => {
    const Boom = require('boom');
    const Sequelize = require('sequelize');
    const Op = Sequelize.Op;
    const housingWantedModels = require('./housing-wanted.models');
    const accountLib = require('../account/account.controllers')(models).lib;
    const locationLib = require('../location/location.controllers')(models).lib;
    const Log = require('../log/log.controllers')(models).lib;

    return {
      postHousingWanted: async function(request, h){
        /*
          # Require Account for submitting fields other than address
        */
        let payload = request.payload;
        let account;
        try {
         account = await accountLib.getAccount(request.auth.credentials);
        } catch (e) {
         throw Boom.badImplementation('Error during getAccount(request.auth.credentials). ' + e);
       }

        if (account === null) {
          throw Boom.badRequest('Must have an Account to create a housing wanted post');
        }

        /* Restrict AuthorId to same user, or SuperAdmin */
        if (payload.hasOwnProperty('AuthorId')) {
          // If AuthorId is set then we have already passed auth and account lookup
          // This is because if AuthorId is set then not only quickInfo is set
          if (
            payload.AuthorId !== account.id  &&
            request.auth.credentials.subjectId !== process.env.SUPER_ADMIN
          ) {
            throw Boom.badRequest('HousingWanted.AuthorId must match your Account ID or you must be a Super Admin');
          }
        }

        // bedrooms validation
        let bedrooms;
        if (payload.hasOwnProperty('bedrooms')){
          bedrooms = Number(payload.bedrooms);
        }

        // bathrooms validation
        let bathrooms;
        if (payload.hasOwnProperty('bathrooms')) {
          bathrooms = Number(payload.bathrooms);
          // bathrooms can be in .25 increments
          if (!bathroomsValidIncrement(bathrooms)) {
            throw Boom.badData('bathrooms must be in .25 increments');
          }
        }

        // start building housingWanted object
        let housingWantedObject = {
          title: payload.title,
          contact: payload.contact,
          body: payload.body,
        };

        if (payload.hasOwnProperty('AuthorId')) {
          housingWantedObject.AuthorId = payload.AuthorId;
        } else {
          housingWantedObject.AuthorId = account.id;
        }

        if (payload.hasOwnProperty('bedrooms')) {
          housingWantedObject.bedrooms = bedrooms;
        }

        if (payload.hasOwnProperty('bathrooms')) {
          housingWantedObject.bathrooms = bathrooms;
        }

        if (payload.hasOwnProperty('status')) {
          housingWantedObject.status = payload.status;
        } else {
          housingWantedObject.status = 'active';
        }

        if (payload.hasOwnProperty('details')) {
          housingWantedObject.details = payload.details;
        }

        let housingWantedInstance;
        try {
          housingWantedInstance = await createHousingWanted(housingWantedObject);
        } catch (e) {
          throw Boom.badImplementation('Error during createHousingWanted(housingWantedObject).', e);
        }

        if (payload.hasOwnProperty('LocationIds')) {
          // normalize to array
          let locationIds = [].concat(payload.LocationIds);
          for (let locationId of locationIds) {
            try {
              await models.HousingWantedLocation.create({
                HousingWantedId: housingWantedInstance.id,
                LocationId: locationId
              });
            } catch (error) {
              console.error('Error during models.HousingWantedLocation.create(...).', e);
            }
          }
        }

        return h
          .response(housingWantedInstance);
      }
    };

    /*
   * Puts a housing wanted object in the DB and returns an instance
   */
  function createHousingWanted(housingWantedObject) {
    return models.HousingWanted.create(housingWantedObject);
  }

  function bathroomsValidIncrement(value){
    // multiply by 100 to take valid values out of decimal form, to work around
    // javascript modulo errors with floating point numbers. equivalent to value % .25
    let remainder = (value * 100) % 25;

    // remainder 0 means exactly divisible, or a correct multiple of .25
    if (remainder === 0) {
      return true;
    }

    return false;
  }

};

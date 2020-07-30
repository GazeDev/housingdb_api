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
        if (payload.AuthorId) {
          // If AuthorId is set then we have already passed auth and account lookup
          // This is because if AuthorId is set then not only quickInfo is set
          if (
            payload.AuthorId !== account.id  &&
            request.auth.credentials.subjectId !== process.env.SUPER_ADMIN
          ) {
            throw Boom.badRequest('HousingWanted.AuthorId must match your Account ID or you must be a Super Admin');
          }
        }

        // bathrooms validation
      let hasBathrooms = false;
      let bathrooms = Number(request.payload.bathrooms);
      if (bathrooms) {
        hasBathrooms = true;
      }

      // number of bathrooms should be set
      // return true if bathrooms object has specified property
      if (request.payload.hasOwnProperty("bathrooms")){
        hasBathrooms = true;
      }

      // bathrooms can be in .25 increments
      if (hasBathrooms && (!bathroomsValidIncrement(bathrooms)) ) {
        throw Boom.badData('bathrooms must be in .25 increments');
      }

      // bedrooms validation
      let hasBedrooms = false;
      let bedrooms = Number(request.payload.bedrooms);
      // return true if bedrooms object has specified property
      if (request.payload.hasOwnProperty("bedrooms")){
        hasBedrooms = true;
      }

      // let locationTerms = [addressObject.addressRegion];
      let locationTerms = [addressObject.addressRegion, addressObject.addressLocality];
      if (addressObject.hasOwnProperty('addressNeighborhood')) {
        locationTerms.push(addressObject.addressNeighborhood);
      } else {
        locationTerms.push(addressObject.addressLocality);
      }

      // start building housingWanted object
      let housingWantedObject = {
        AuthorId: account.id,
        title: request.payload.title,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        contact: request.payload.contact,
        body: request.payload.body,
        status: request.payload.status,
        detials: request.payload.details,
      };

      let locationId = await locationLib.locationFindCreateNestedTerms(locationTerms);
      housingWantedObject.HousingWantedLocationId = locationId;

      let housingWantedInstance = await createHousingWanted(housingWantedObject);

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

    
  
  };
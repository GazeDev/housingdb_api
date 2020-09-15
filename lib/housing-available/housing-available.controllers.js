module.exports = (models) => {
  const Boom = require('boom');
  const Sequelize = require('sequelize');
  const Op = Sequelize.Op;
  // const housingAvailableModels = require('./housing-available.models');
  // const housingAvailableRoutes = require('./housing-available.routes');
  const Log = require('../log/log.controllers')(models).lib;
  const accountLib = require('../account/account.controllers')(models).lib;
  const propertyLib = require('../property/property.controllers')(models).lib;
  const locationLib = require('../location/location.controllers')(models).lib;
  const postalAddressLib = require("../postal-address/postal-address.controllers")(models).lib;

  return {

    // Create new housingAvailable rental listing;
    postHousingAvailable: async function (request, h) {
      /*
        # Require Account; user must be a logged-in user (i.e. have an Account) to post a rental;
      */
      let account;
      let payload = request.payload;
      try {
        account = await accountLib.getAccount(request.auth.credentials);
      } catch (e) {
        throw Boom.badImplementation('Error during getAccount(request.auth.credentials). ' + e);
      }

      if (account === null) {
        throw Boom.badRequest('Must have an Account to create a HousingAvailable');
      }

      /* Restrict AuthorId to same user, or SuperAdmin */
      if (payload.AuthorId) {
        // If AuthorId is set then we have already passed auth and account lookup
        // This is because if AuthorId is set then not only quickInfo is set
        if (
          payload.AuthorId !== account.id &&
          request.auth.credentials.subjectId !== process.env.SUPER_ADMIN
        ) {
          throw Boom.badRequest('HousingAvailable.AuthorId must match your Account ID or you must be a Super Admin');
        }
      }

      // bedrooms validation:
      let hasBedrooms = false;
      let bedrooms = Number(request.payload.bedrooms);
      if (request.payload.hasOwnProperty("bedrooms")) {
        hasBedrooms = true;
      }

      // bathrooms validation:
      let hasBathrooms = false;
      let bathrooms = Number(request.payload.bathrooms);
      if (request.payload.hasOwnProperty("bathrooms")) {
        hasBathrooms = true;
      }

      // bathrooms can be in .25 increments
      if (hasBathrooms && !bathroomsValidIncrement(bathrooms)) {
        throw Boom.badData('bathrooms must be in .25 increments');
      }

      // start building HousingAvailable object
      let housingAvailableObject = {};
      if (request.payload.title && request.payload.title !== request.payload.address) {
        housingAvailableObject.title = request.payload.title;
      }

      if (request.payload.AuthorId) {
        housingAvailableObject.AuthorId = request.payload.AuthorId;
      } else {
        housingAvailableObject.AuthorId = account.id;
      }

      if (request.payload.body) {
        housingAvailableObject.body = request.payload.body;
      }

      if (request.payload.status) {
        housingAvailableObject.status = request.payload.status;
      }

      // if (request.payload.details) {
      //   housingAvailableObject.details = request.payload.details;
      // }

      if (hasBathrooms) {
        housingAvailableObject.bathrooms = request.payload.bathrooms;
      }

      if (hasBedrooms) {
        housingAvailableObject.bedrooms = bedrooms;
      }

      if (request.payload.website) {
        housingAvailableObject.website = request.payload.website;
      }

      // Validate address;
      let hasAddress = false;
      if (request.payload.hasOwnProperty("address")) {
        hasAddress = true;
      }

      let addressObject;
      if (hasAddress) {
        // Check whether address associated with an existing HousingAvailable listing;
        let geocodes = await postalAddressLib.addressGeocode(request.payload.address);
        if (!geocodes.results || geocodes.results.length === 0) {
          try {
            await Log.request({
              type: 'property.submit.failed.no_results',
              severity: 'Notice',
              request: request,
            });
          } catch (e) { }
          throw Boom.badData('No results for that address');
        }
        const firstGeocode = geocodes.results[0];

        // const util = require('util')
        // console.log(util.inspect(firstGeocode, {showHidden: false, depth: null}))
        // Extract address info from associate address object, if one exists;
        addressObject = postalAddressLib.extractAddress(firstGeocode);
        if (!addressObject.addressNumber) {
          try {
            await Log.request({
              type: 'property.submit.failed.street_number',
              severity: 'Notice',
              request: request,
            });
          } catch (e) { }
          throw Boom.badData('Address is missing a street number');
        }
        // In some places addresses don't have a county; in that case, copy up the locality to normalize
        if (!addressObject.hasOwnProperty('addressCounty')) {
          addressObject.addressCounty = addressObject.addressLocality;
        }
        if (
          addressObject.addressRegion !== process.env.ADDRESS_LIMIT_STATE ||
          addressObject.addressCounty !== process.env.ADDRESS_LIMIT_COUNTY
        ) {
          try {
            await Log.request({
              type: 'property.submit.failed.county',
              severity: 'Notice',
              request: request,
            });
          } catch (e) { }
          throw Boom.badData('Sorry, We are only accepting properties in ' + `${process.env.ADDRESS_LIMIT_COUNTY}, ${process.env.ADDRESS_LIMIT_STATE}`);
        }
        const addressHash = postalAddressLib.hashAddress(addressObject);

        addressObject.hash = addressHash;

        const existingAddresses = await postalAddressLib.getAddressesByHash(addressHash);
        if (existingAddresses.length > 0) {
          housingAvailableObject.PropertyId = existingAddresses[0].PropertyId;
        } else {
          // TODO: create new Property and attach it to this;
        }
        let locationTerms = [addressObject.addressRegion, addressObject.addressLocality];
        if (addressObject.hasOwnProperty('addressNeighborhood')) {
          locationTerms.push(addressObject.addressNeighborhood);
        } else {
          locationTerms.push(addressObject.addressLocality);
        }
        let locationId = await locationLib.locationFindCreateNestedTerms(locationTerms);
        housingAvailableObject.LocationId = locationId;
      }

      if (hasAddress) {
        housingAvailableObject.address = request.payload.address;
      }

      if (request.payload.contact) {
        housingAvailableObject.contact = request.payload.contact;
      }

      // Create a 'hapi' instance: our hAObject + metadata about it;
      let housingAvailableInstance;
      try {
        housingAvailableInstance = await createHousingAvailable(housingAvailableObject);
      } catch (e) {
        throw Boom.badImplementation('Error during createHousingAvailable(housingAvailableObject): ', e);
      }
      return h
        .response(housingAvailableInstance);
    },
    // Display all Housing Available listings;
    getHousingAvailable: async function (request, h) {
      let response;
      try {
        response = await models.HousingAvailable.findAll();
      } catch (e) {
        throw Boom.badImplementation('Error during models.HousingAvailable.findAll(): ', e);
      }
      return response;
    },
  }

   /*
    * Put a HousingAvailable object in the DB and return an instance
    */
  function createHousingAvailable(housingAvailableObject) {
    return models.HousingAvailable.create(housingAvailableObject);
  }

  function bathroomsValidIncrement(value) {
    // multiply by 100 to take valid values out of decimal form, to work around
    // javascript modulo errors with floating point numbers. equivalent to value % .25
    let remainder = (value * 100) % 25;

    // remainder 0 means exactly divisible, or a correct multiple of .25
    return (remainder === 0);
  }
};

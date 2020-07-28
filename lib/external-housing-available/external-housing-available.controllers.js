module.exports = (models) => {
  const Boom = require('boom');
  const Sequelize = require('sequelize');
  const externalHousingAvailableModels = require('./external-housing-available.models');
  const postalAddressLib = require('../postal-address/postal-address.controllers')(models).lib;
  const Log = require('../log/log.controllers')(models).lib;
  const geoCoordinatesLib = require('../geo-coordinates/geo-coordinates.controllers')(models).lib;

  return {
    postExternalHousingAvailable: async function(request, h) {
      /*
        # Require Account for submitting fields, and location. 
        # Account also must be SUPER_ADMIN
      */
      let account;
      let payload = request.payload;

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

      //Match address input with geocoder.
      var geocodes = await postalAddressLib.addressGeocode(request.payload.address);
      //If address doesnt exist or length is 0. 
      if (!geocodes.results || geocodes.results.length === 0) {
        try {
          //Log it into the logger
          await Log.request({
            type: 'externalhousingaddress.submit.failed.no_results',
            severity: 'Notice',
            request: request,
          });
        } catch (e) {
          throw Boom.badData('No results for that address');
        }
      } 

      //Ni

      /**
       * Else we take the first index of the geocodes results, 
       * first thing that came back with our results. 
       * Double check, please ask Zac or look up what geocodes format is.
       * Just to better understand what [0] index is holding.
       */
      const firstGeocode = geocodes.results[0];

      //Now that we have our result, we can build our address object using the lib from postal
      let addressObject = postalAddressLib.extractAddress(firstGeocode);
      //If address does not have a valid street number.
      if (!addressObject.addressNumber) {
        try {
          await Log.request({
            type: 'externalhousingaddress.submit.failed.street_number',
            severity: 'Notice',
            request: request,
          });
        } catch (e) {
          throw Boom.badData('Address is missing a street number');
        }
      }

      //Address without a county, we want to use locality instead.
      if (!addressObject.hasOwnProperty('addressCounty')) {
        addressObject.addressCounty = addressObject.addressLocality;
      }
      if (
        addressObject.addressRegion !== process.env.ADDRESS_LIMIT_STATE ||
        addressObject.addressCounty !== process.env.ADDRESS_LIMIT_COUNTY
      ) {
        try {
          await Log.request({
            type: 'externalhousingaddress.submit.failed.county',
            severity: 'Notice',
            request: request,
          }); 
        } catch (e) {} 
          throw Boom.badData('Sorry, We are only accepting properties in ' + `${process.env.ADDRESS_LIMIT_COUNTY}, ${process.env.ADDRESS_LIMIT_STATE}`); 
      }

      //Extracting the address using function from geoCoordinates lib
      let geoCoordObject = geoCoordinatesLib.extractLocation(firstGeocode);
      
      //Need to go over this again. 
      const addressHash = postalAddressLib.hashAddress(addressObject);
      addressObject.hash = addressHash;

      /**
       * If address is already existing then we want to get address
       * Ask Zac is this ever going to happen since this is an external listing
       */
      const existingAddresses = await postalAddressLib.getAddressesByHash(addressHash);
      if (existingAddresses.length > 0) {
        //if result is greater than 0, that means existing
        let error = Boom.badData('Address already exists');
        //make sure headers should be in content location
        error.output.headers["Content-Location"] = existingAddresses[0].PropertyId;
        throw error;
      }

      //Finally finish building out the address object
      const standardizedAddress = postalAddressLib.standardizeAddress(addressObject);
      addressObject.address = standardizedAddress;
      
      /**
       * Start off as an empty object and then build it up line by line. 
       *AuthorId: account.id,
        title: title,
        address: address,
        beds: beds,
        baths: baths,
        contact: contact,
        body: body,
        status: status, //Maybe? 
        url: request.payload.url,
       */

      // External Housing Available Object 
      let externalHousingAvailableObject = {};
      
      //Title
      if (request.payload.title && request.payload.title !== request.payload.address) {
        externalHousingAvailableObject.title = request.payload.title;
      } else {
        externalHousingAvailableObject.title = standardizedAddress; 
      }

      //createMachineName is a bunch of regex
      externalHousingAvailableObject.machineName = await createMachineName(standardizedAddress);

      //AuthorId
      if (request.payload.AuthorId) {
        externalHousingAvailableObject.AuthorId = request.payload.AuthorId;
      }

      //Ask Zac if this needs to be wrapped in a hapi handler
      //Just incase if any input was not a Number? 

      //Beds
      if (request.payload.bedrooms) {
        //Maybe combine this two line
        let bedrooms = Number(request.payload.bedrooms);
        externalHousingAvailableObject.bedrooms = bedrooms;
      }
      //Baths
      if (request.payload.bathrooms) {
        //Maybe combine this two line
        let bathrooms = Number(request.payload.bathrooms);
        externalHousingAvailableObject.bathrooms = bathrooms;
      }
      //Contacts 
      if (request.payload.contact) {
        externalHousingAvailableObject.contact = request.payload.contact;
      }
      //Body
      if (request.payload.body) {
        externalHousingAvailableObject.body = request.payload.body;
      }
      //Url
      if (request.payload.url) {
        externalHousingAvailableObject.url = request.payload.url;
      }

      //Status, maybe? 

    }
  };
};

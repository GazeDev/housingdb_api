const joi = require('joi');
module.exports = (models) => {
  const Boom = require('boom');
  const Sequelize = require('sequelize');
  const Op = Sequelize.Op;
  const housingAvailableModels = require('./housing-available.models');
  const Log = require('../log/log.controllers')(models).lib;
  const accountLib = require('../account/account.controllers')(models).lib;
  const propertyLib = require('../property/property.controllers')(models).lib;
  const postalAddressLib = require("../postal-address/controllers")(models).lib;

  return {

    // Create new housingAvailable rental listing;
    postHousingAvailable: async function(request, h) {
      /*
        # Require Account; user must be a logged-in user (i.e. have an Account) to post a rental;
      */
      let account;
      let payload = request.payload;
      let payloadKeys = Object.keys(payload);
      // Verify user is logged in;
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
        throw Boom.badRequest('Must have an Account to create a HousingAvailable.');
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

      // take information in, process it
      // Check whether address associated with HousingAvailable listing
      let geocodes = await postalAddressLib.addressGeocode(request.payload.address);
      if (!geocodes.results || geocodes.results.length === 0) {
        try {
          await Log.request({
            type: 'property.submit.failed.no_results',
            severity: 'Notice',
            request: request,
          });
        } catch (e) {}
        throw Boom.badData('No results for that address');
      }

      const firstGeocode = geocodes.results[0];

      // const util = require('util')
      // console.log(util.inspect(firstGeocode, {showHidden: false, depth: null}))
      let addressObject = postalAddressLib.extractAddress(firstGeocode);
      if (!addressObject.addressNumber) {
        try {
          await Log.request({
            type: 'property.submit.failed.street_number',
            severity: 'Notice',
            request: request,
          });
        } catch (e) {}
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
        } catch (e) {}
        throw Boom.badData('Sorry, We are only accepting properties in ' + `${process.env.ADDRESS_LIMIT_COUNTY}, ${process.env.ADDRESS_LIMIT_STATE}`);
      }

      let geoCoordObject = geoCoordinatesLib.extractLocation(firstGeocode);

      const addressHash = postalAddressLib.hashAddress(addressObject);

      addressObject.hash = addressHash;

      const existingAddresses = await postalAddressLib.getAddressesByHash(addressHash);
      if (existingAddresses.length > 0) {
        housingAvailableObject.PropertyId = existingAddresses[0].PropertyId;
      } else {
        // TODO: create new Property and attach it to this;
      }

      // bathrooms validation
      let hasBathrooms = false;
      let bathroomsMin = Number(request.payload.bathroomsMin);
      let bathroomsMax = Number(request.payload.bathroomsMax);
      if (bathroomsMin || bathroomsMax) {
        hasBathrooms = true;
      }

      // if one value is set, they both should be set
      if (hasBathrooms && !bothDefined(bathroomsMin, bathroomsMax)) {
        throw Boom.badData('if either bathroomsMin or bathroomsMax is set, both must be set');
      }

      // min should be less than max
      if (hasBathrooms && (bathroomsMin > bathroomsMax)) {
        throw Boom.badData('bathroomsMin should be less than bathroomsMax');
      }

      // bathrooms can be in .25 increments
      if (hasBathrooms &&
        (
          !bathroomsValidIncrement(bathroomsMin) ||
          !bathroomsValidIncrement(bathroomsMax)
        )
      ) {
        throw Boom.badData('bathroomsMin and bathroomsMax must be in .25 increments');
      }

      // start building HousingAvailable object
      let housingAvailableObject = {};
      if (request.payload.title && request.payload.title !== request.payload.address) {
        housingAvailableObject.title= request.payload.title;
      }

      // TODO: is this necessary?  AuthorId is generated by Sequelize;
      if (request.payload.AuthorId) {
        housingAvailableObject.AuthorId = request.payload.AuthorId;
      }

      if (request.payload.body) {
        housingAvailableObject.body = request.payload.body;
      }

      if (request.payload.status) {
        housingAvailableObject.status = request.payload.status;
      }

      if (request.payload.details) {
        housingAvailableObject.details = request.payload.details;
      }

      if (hasBathrooms) {
        housingAvailableObject.bathrooms = request.payload.bathrooms;
      }

      if (hasBedrooms) {
        housingAvailableObject.bedrooms = request.payload.bedrooms;
      }

      if (request.payload.website) {
        housingAvailableObject.website = request.payload.website;
      }

      if (request.payload.address) {
        housingAvailableObject.address = request.payload.address;
      }

      if (request.payload.contact) {
        housingAvailableObject.contact = request.payload.contact;
      }

      if (request.payload.metadata) {
        housingAvailableObject.metadata = request.payload.metadata;
      }

      // let locationTerms = [addressObject.addressRegion];
      let locationTerms = [addressObject.addressRegion, addressObject.addressLocality];
      if (addressObject.hasOwnProperty('addressNeighborhood')) {
        locationTerms.push(addressObject.addressNeighborhood);
      } else {
        locationTerms.push(addressObject.addressLocality);
      }
      let locationId = await locationLib.locationFindCreateNestedTerms(locationTerms);
      housingAvailableObject.LocationId = locationId;

      let propertyInstance = await createProperty(housingAvailableObject);

      addressObject.PropertyId = propertyInstance.id;

      const addressInstance = await postalAddressLib.createAddress(addressObject);

      geoCoordObject.PropertyId = propertyInstance.id;
      const geoCoordInstance = await geoCoordinatesLib.createLocation(geoCoordObject);

      const returnProperty = await getProperty(propertyInstance.id);
      // TODO: use try/catch with await?

      return h
        .response(returnProperty);

    },
  };
};

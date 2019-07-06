module.exports = (models) => {
  const Boom = require('boom');
  const postalAddressLib = require('../postal-address/postal-address.controllers')(models).lib;
  const geoCoordinatesLib = require('../geo-coordinates/geo-coordinates.controllers')(models).lib;
  const propertyModels = require('./property.models');

  return {


    getProperties: async function(request, h) {
      const returnProperties = await getProperties();
      // TODO: use try/catch with await?
      return h
        .response(returnProperties);
    },
    getProperty: async function(request, h) {
      const returnProperty = await getProperty(request.params.id);
      // TODO: use try/catch with await?
      return h
        .response(returnProperty);
    },
    getPropertiesSchema: function(request, h) {
      const convert = require('joi-to-json-schema');
      return convert(propertyModels.api);
    },
    postProperty: async function(request, h) {
      var geocodes = await postalAddressLib.addressGeocode(request.payload.address);
      if (!geocodes.results || geocodes.results.length === 0) {
        throw Boom.badData('No results for that address');
      }

      const firstGeocode = geocodes.results[0];

      // const util = require('util')
      // console.log(util.inspect(firstGeocode, {showHidden: false, depth: null}))
      let addressObject = postalAddressLib.extractAddress(firstGeocode);
      if (!addressObject.addressNumber) {
        throw Boom.badData('Address is missing a street number');
      }

      let locationObject = geoCoordinatesLib.extractLocation(firstGeocode);

      const addressHash = postalAddressLib.hashAddress(addressObject);

      addressObject.hash = addressHash;

      const existingAddresses = await postalAddressLib.getAddressesByHash(addressHash);
      if (existingAddresses.length > 0) {
        throw Boom.badData('Address already exists');
      }

      const standardizedAddress = postalAddressLib.standardizeAddress(addressObject);


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

      // bedrooms validation
      let hasBedrooms = false;
      let bedroomsMin = request.payload.bedroomsMin;
      let bedroomsMax = request.payload.bedroomsMax;
      if (bedroomsMin || bedroomsMax) {
        hasBedrooms = true;
      }

      // if one value is set, they both should be set
      if (hasBedrooms && !bothDefined(bedroomsMin, bedroomsMax)) {
        throw Boom.badData('if either bedroomsMin or bedroomsMax is set, both must be set');
      }

      // min should be less than max
      if (hasBedrooms && (bedroomsMin > bedroomsMax)) {
        throw Boom.badData('bedroomsMin should be less than bedroomsMax');
      }

      // start building property object
      let propertyObject = {};
      if (request.payload.name) {
        propertyObject.name = request.payload.name;
      } else {
        propertyObject.name = standardizedAddress;
      }

      if (hasBathrooms) {
        propertyObject.bathroomsMin = bathroomsMin;
        propertyObject.bathroomsMax = bathroomsMax;
      }

      if (hasBedrooms) {
        propertyObject.bedroomsMin = bedroomsMin;
        propertyObject.bedroomsMax = bedroomsMax;
      }

      if (request.payload.body) {
        propertyObject.body = request.payload.body;
      }

      let propertyInstance = await createProperty(propertyObject);

      addressObject.PropertyId = propertyInstance.id;

      const addressInstance = await postalAddressLib.createAddress(addressObject);

      locationObject.PropertyId = propertyInstance.id;
      const locationInstance = await geoCoordinatesLib.createLocation(locationObject);

      const returnProperty = await getProperty(propertyInstance.id);
      // TODO: use try/catch with await?

      return h
        .response(returnProperty);

    },
    deleteProperty: function(request, h) {
      return models.Property.destroy({
        where: {
          id: request.params.id,
        },
      })
      .then(response => {
        return h
        .response(response)
        .code(202);
      })
      .catch(error => {
        return error;
      });
    },
    lib: {
      createProperty: createProperty,
    }

  };




  /*
   * Puts a property object in the DB and returns an instance
   */
  function createProperty(propertyObject) {
    return models.Property.create(propertyObject)
    .then(response => {
      return response;
    })
    .catch(error => {
      return error;
    });
  }

  function getProperties() {
    return models.Property.findAll(getPropertyOptions())
    .then(response => {
      return response;
    })
    .catch(error => {
      return error;
    });
  }

  function getProperty(id) {
    return models.Property.findByPk(id, getPropertyOptions())
    .then(response => {
      return response;
    })
    .catch(error => {
      return error;
    });
  }

  function getPropertyOptions() {
    const propertyOptions = {
      include: [
         {
           model: models.PostalAddress,
         },
         {
           model: models.GeoCoordinates,
         }
       ]
    };
    return propertyOptions;
  }

  function bothDefined (value1, value2) {
    let bothDefined = (value1 != undefined && value2 != undefined);
    return bothDefined;
  }

  function bathroomsValidIncrement(value) {
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

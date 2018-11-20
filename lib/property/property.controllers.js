module.exports = (models) => {
  const postalAddressLib = require('../postal-address/postal-address.controllers')(models).lib;
  const geoCoordinatesLib = require('../geo-coordinates/geo-coordinates.controllers')(models).lib;
  const propertyModels = require('./property.models');

  return {


    getProperties: async function(request, h) {
      console.log('findall');
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
      if (!geocodes.results) {
        return h
          .response({error: 'no results'});
      }

      const firstGeocode = geocodes.results[0];

      const util = require('util')
      // console.log(util.inspect(firstGeocode, {showHidden: false, depth: null}))
      let addressObject = postalAddressLib.extractAddress(firstGeocode);

      let locationObject = geoCoordinatesLib.extractLocation(firstGeocode);

      const addressHash = postalAddressLib.hashAddress(addressObject);

      addressObject.hash = addressHash;

      const existingAddresses = await postalAddressLib.getAddressesByHash(addressHash);
      if (existingAddresses.length > 0) {
        return h
          .response({error: 'address already exists'});
      }

      const standardAddress = postalAddressLib.standardizeAddress(addressObject);

      // start building property object
      let propertyObject = {};
      if (request.payload.name) {
        propertyObject.name = request.payload.name;
      } else {
        propertyObject.name = standardAddress;
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
    return models.Property.findById(id, getPropertyOptions())
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


};

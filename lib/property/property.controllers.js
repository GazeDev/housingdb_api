module.exports = (models) => {
  const Boom = require('boom');
  const postalAddressLib = require('../postal-address/postal-address.controllers')(models).lib;
  const geoCoordinatesLib = require('../geo-coordinates/geo-coordinates.controllers')(models).lib;
  const propertyModels = require('./property.models');
  const accountLib = require('../account/account.controllers')(models).lib;

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
    getPropertyByMachineName: async function(request, h) {
      const returnProperty = await getPropertyByMachineName(request.params.machineName);
      // TODO: use try/catch with await?
      return h
        .response(returnProperty);
    },
    getPropertiesSchema: function(request, h) {
      const convert = require('joi-to-json-schema');
      return convert(propertyModels.api);
    },
    postProperty: async function(request, h) {
      /*
        # Require Account for submitting fields other than address
      */
      let account;
      let payload = request.payload;
      let payloadKeys = Object.keys(payload);
      if (payloadKeys.length !== 1 || payloadKeys[0] !== 'address') {
        // not only address set, user must be authd
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

      // take information in, process it
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

      // In some places addresses don't have a county, in that case copy up the locality to normalize
      if (!addressObject.hasOwnProperty('addressCounty')) {
        addressObject.addressCounty = addressObject.addressLocality;
      }
      if (
        addressObject.addressRegion !== process.env.ADDRESS_LIMIT_STATE ||
        addressObject.addressCounty !== process.env.ADDRESS_LIMIT_COUNTY
      ) {
        throw Boom.badData('Sorry, We are only accepting properties in ' + `${process.env.ADDRESS_LIMIT_COUNTY}, ${process.env.ADDRESS_LIMIT_STATE}`);
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

      //insert function for machine name creation

      //call
      propertyObject.machineName = await createMachineName(propertyObject.name);

      if (request.payload.AuthorId) {
        propertyObject.AuthorId = request.payload.AuthorId;
      }

      if (hasBathrooms) {
        propertyObject.bathroomsMin = bathroomsMin;
        propertyObject.bathroomsMax = bathroomsMax;
      }

      if (hasBedrooms) {
        propertyObject.bedroomsMin = bedroomsMin;
        propertyObject.bedroomsMax = bedroomsMax;
      }

      if (request.payload.website) {
        propertyObject.website = request.payload.website;
      }

      if (request.payload.contact) {
        propertyObject.contact = request.payload.contact;
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
    getAccountProperties: async function(request, h) {
      let account;
      try {
        account = await accountLib.getAccount(request.auth.credentials);
      } catch (e) {
        throw Boom.badImplementation('Error during getAccount(request.auth.credentials). ' + e);
      }

      if (account === null) {
        throw Boom.badRequest('Must have an Account to get own Properties');
      }

      return await getAccountProperties(account.id);
    },
    lib: {
      getProperty: getProperty,
      createProperty: createProperty,
      getPropertyOptions: getPropertyOptions
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

  function getPropertyByMachineName(machineName) {
    return models.Property.findOne({
      where: {machineName: machineName}
    })

    .then(response => {
      return response;
    })
    .catch(error => {
      return error;
    });
  }

  async function createMachineName (name){
    const space = / /gi; //replaces spaces with -
    const replace = /[/,.]/gi; //replaces characters within [] with a -
    const remove = /[!?@#$%^&*<>;:|]/gi; //removes characters within []
    const duplicate = /-+/gi; //bye bye duplicate dashes
    const trimming = /^[-]|[-]$/gi // ^ = leading characters, $ = trailing characters


    name = name.toLowerCase();
    name = name.replace(space, "-"); //replaces spaces with -
    name = name.replace(replace, "-"); //replaces characters within [] with a -
    name = name.replace(remove, ""); //removes characters within []
    name = name.replace(duplicate, "-"); //bye bye duplicate dashes
    name = name.replace(trimming, ""); // ^ = leading characters, $ = trailing characters


    let unique = false;
    let counter = 0;

    let machineName = name;


    while(!unique) {
      // TODO: efficiency could be improved with an Op.like lookup
      let propertyExists = await getPropertyByMachineName(machineName);
      if(propertyExists === null) {unique = true}
      else {
        counter ++;
        machineName = name + "-" + counter;
      }

    }

    return machineName;
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

  function getAccountProperties(accountId) {
    let propertyOptions = {
      where: {
        AuthorId: accountId,
      },
    };
    return models.Property.findAll(propertyOptions);
  }

};

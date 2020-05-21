module.exports = (models) => {
  const Boom = require('boom');
  const Sequelize = require('sequelize');
  const Op = Sequelize.Op;
  const postalAddressLib = require('../postal-address/postal-address.controllers')(models).lib;
  const geoCoordinatesLib = require('../geo-coordinates/geo-coordinates.controllers')(models).lib;
  const locationLib = require('../location/location.controllers')(models).lib;
  const propertyModels = require('./property.models');
  const accountLib = require('../account/account.controllers')(models).lib;
  const Log = require('../log/log.controllers')(models).lib;

  return {
    adminGenerateMachineNames: async function(request, h) {
      ensureAdmin(request);
      let machineNamelessProperties;
      try {
        // Match machine names that are null or contain parenthesis or brackets
        let regexp = '[()\\[\\]]';
        // Searches for null machine names, or ones that match regexp
        machineNamelessProperties = await getAllPropertiesByMachineName({
          [Op.or]: {
            [Op.regexp]: regexp,
            [Op.is]: null,
          },
        });
        for (let property of machineNamelessProperties) {
          let machineName = await createMachineName(property.PostalAddresses[0].address);
          property.update({machineName: machineName});
        }
      } catch (e) {
        throw Boom.badImplementation('Error during adminGenerateMachineNames. ' + e);
      }
      return machineNamelessProperties;
    },
    getProperties: async function(request, h) {
      let returnProperties;
      try {
        returnProperties = await getProperties(request.query);
      } catch (e) {
        throw Boom.badImplementation('Error during getProperties(). ' + e);
      }
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

      // In some places addresses don't have a county, in that case copy up the locality to normalize
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
        let error = Boom.badData('Address already exists');
        error.output.headers["Content-Location"] = existingAddresses[0].PropertyId;
        throw error;
      }

      const standardizedAddress = postalAddressLib.standardizeAddress(addressObject);
      addressObject.address = standardizedAddress;

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
      if (request.payload.name && request.payload.name !== request.payload.address) {
        propertyObject.name = request.payload.name;
      } else {
        propertyObject.name = standardizedAddress;
      }

      propertyObject.machineName = await createMachineName(standardizedAddress);

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

      // let locationTerms = [addressObject.addressRegion];
      let locationTerms = [addressObject.addressRegion, addressObject.addressLocality];
      if (addressObject.hasOwnProperty('addressNeighborhood')) {
        locationTerms.push(addressObject.addressNeighborhood);
      } else {
        locationTerms.push(addressObject.addressLocality);
      }
      let locationId = await locationLib.locationFindCreateNestedTerms(locationTerms);
      propertyObject.LocationId = locationId;

      let propertyInstance = await createProperty(propertyObject);

      addressObject.PropertyId = propertyInstance.id;

      const addressInstance = await postalAddressLib.createAddress(addressObject);

      geoCoordObject.PropertyId = propertyInstance.id;
      const geoCoordInstance = await geoCoordinatesLib.createLocation(geoCoordObject);

      const returnProperty = await getProperty(propertyInstance.id);
      // TODO: use try/catch with await?

      return h
        .response(returnProperty);

    },
    patchProperty: async function(request, h) {
      let propertyId = request.params.id;
      let propertyInstance = await getProperty(propertyId);
      let propertyObject = {};

      // Make sure property exists
      if (propertyInstance === null) {
        throw Boom.badRequest('Property does not exist');
      }

      // Throw if no account found
      let account = await ensureAccount(request);

      // If User not Admin, must own content, cannot submit 'AuthorId' or 'address' fields
      if (request.auth.credentials.subjectId !== process.env.SUPER_ADMIN) {
        if (propertyInstance.AuthorId !== account.id) {
          throw Boom.badRequest('Property.AuthorId must match your Account ID or you must be a Super Admin');
        }

        if (request.payload.hasOwnProperty('AuthorId')) {
          throw Boom.badRequest('Only an Admin can change the AccountId');
        }

        if (request.payload.hasOwnProperty('address')) {
          throw Boom.badRequest('Only an Admin can change the address');
        }
      }

      // If address change, update it and related fields
      let standardizedAddress;
      let locationObject;
      let addressObject;
      if (request.payload.hasOwnProperty('address')) {
        // IN: Address string, existing propertyID if applicable

        // Geocode address
        var geocodes = await postalAddressLib.addressGeocode(request.payload.address);
        if (!geocodes.results || geocodes.results.length === 0) {
          throw Boom.badData('No results for that address');
        }
        const firstGeocode = geocodes.results[0];
        // Extract Address
        addressObject = postalAddressLib.extractAddress(firstGeocode);
        if (!addressObject.addressNumber) {
          throw Boom.badData('Address is missing a street number');
        }
        // Normalize County
        if (!addressObject.hasOwnProperty('addressCounty')) {
          addressObject.addressCounty = addressObject.addressLocality;
        }
        // Validate County and State
        if (
          addressObject.addressRegion !== process.env.ADDRESS_LIMIT_STATE ||
          addressObject.addressCounty !== process.env.ADDRESS_LIMIT_COUNTY
        ) {
          throw Boom.badData('Sorry, We are only accepting properties in ' + `${process.env.ADDRESS_LIMIT_COUNTY}, ${process.env.ADDRESS_LIMIT_STATE}`);
        }
        // Get location
        locationObject = geoCoordinatesLib.extractLocation(firstGeocode);
        // Generate address hash
        const addressHash = postalAddressLib.hashAddress(addressObject);
        addressObject.hash = addressHash;
        // Make sure address doesn't already exist,
        // Returns additional context if address matches current property
        // 'address' should not be sent on PATCH if it is not changing
        const existingAddresses = await postalAddressLib.getAddressesByHash(addressHash);
        if (existingAddresses.length > 0) {
          if (
            existingAddresses.length === 1 &&
            existingAddresses[0].PropertyId === propertyId
          ) {
            throw Boom.badData('Address already exists, and matches this property');
          }
          throw Boom.badData('Address already exists');
        }
        // Make standardized address string
        standardizedAddress = postalAddressLib.standardizeAddress(addressObject);
        // If name not set on payload, and old name == old address
        // make new name = new address
        let previousName = propertyInstance.get('name');
        let previousAddressObject = propertyInstance.get('PostalAddresses', {plain:true})[0];
        let previousStandardizedAddress = postalAddressLib.standardizeAddress(previousAddressObject);
        if (
          !request.payload.hasOwnProperty('name') &&
          previousName == previousStandardizedAddress
        ) {
          propertyObject.name = standardizedAddress;
        }
        // If address change, update machine name
        propertyObject.machineName = await createMachineName(standardizedAddress);
        // Update Location: wait to persist until the end
        // Update Postal Address: wait to persist until the end

        // returns:
        // - standardizedAddress
        // - addressObject
        // - locationObject
      }

      // AuthorId change, shouldn't need anything else
      if (request.payload.hasOwnProperty('AuthorId')) {
        propertyObject.AuthorId = request.payload.AuthorId;
      }

      // Name
      if (request.payload.hasOwnProperty('name')) {
        propertyObject.name = request.payload.name;
      }

      // Validate bedrooms
      let hasBedrooms = false;
      let bedroomsMin;
      // set hasBedrooms if one set
      // min: prefer new, then old, otherwise undefined
      if (request.payload.hasOwnProperty('bedroomsMin')) {
        hasBedrooms = true;
        bedroomsMin = request.payload.bedroomsMin;
      } else if (propertyInstance.get('bedroomsMin') !== null) {
        hasBedrooms = true;
        bedroomsMin = propertyInstance.get('bedroomsMin');
      }
      let bedroomsMax;
      // high: if new, then old, then null
      if (request.payload.hasOwnProperty('bedroomsMax')) {
        hasBedrooms = true;
        bedroomsMax = request.payload.bedroomsMax;
      } else if (propertyInstance.get('bedroomsMax') !== null) {
        hasBedrooms = true;
        bedroomsMax = propertyInstance.get('bedroomsMax');
      }
      // if hasBedrooms and not bothDefined, error
      if (hasBedrooms && !bothDefined(bedroomsMin, bedroomsMax) && !bothNull(bedroomsMin, bedroomsMax)) {
        throw Boom.badData('if either bedroomsMin or bedroomsMax is set, both must be set');
      }
      // if low bedroom greater than high bedroom, error
      if (hasBedrooms && (bedroomsMin > bedroomsMax)) {
        throw Boom.badData('bedroomsMin should be less than bedroomsMax');
      }

      // Validate bathrooms
      let hasBathrooms = false;
      let bathroomsMin;
      if (request.payload.hasOwnProperty('bathroomsMin')) {
        hasBathrooms = true;
        if (request.payload.bathroomsMin === null) {
          bathroomsMin = null;
        } else {
          bathroomsMin = Number(request.payload.bathroomsMin);
        }
      } else if (propertyInstance.get('bathroomsMin') !== null) {
        hasBathrooms = true;
        bathroomsMin = Number(propertyInstance.get('bathroomsMin'));
      }
      let bathroomsMax;
      if (request.payload.hasOwnProperty('bathroomsMax')) {
        hasBathrooms = true;
        if (request.payload.bathroomsMax === null) {
          bathroomsMax = null;
        } else {
          bathroomsMax = Number(request.payload.bathroomsMax);
        }
      } else if (propertyInstance.get('bathroomsMax') !== null) {
        hasBathrooms = true;
        bathroomsMax = Number(propertyInstance.get('bathroomsMax'));
      }

      if (hasBathrooms && !bothDefined(bathroomsMin, bathroomsMax)  && !bothNull(bathroomsMin, bathroomsMax)) {
        throw Boom.badData('if either bathroomsMin or bathroomsMax is set, both must be set');
      }

      if (hasBathrooms && (bathroomsMin > bathroomsMax)) {
        throw Boom.badData('bathroomsMin should be less than bathroomsMax');
      }

      if (hasBathrooms &&
        (
          !bathroomsValidIncrement(bathroomsMin) ||
          !bathroomsValidIncrement(bathroomsMax)
        )
      ) {
        throw Boom.badData('bathroomsMin and bathroomsMax must be in .25 increments');
      }

      if (hasBedrooms) {
        propertyObject.bedroomsMin = bedroomsMin;
        propertyObject.bedroomsMax = bedroomsMax;
      }
      if (hasBathrooms) {
        propertyObject.bathroomsMin = bathroomsMin;
        propertyObject.bathroomsMax = bathroomsMax;
      }
      // Website doesn't require extra validation
      if (request.payload.hasOwnProperty('website')) {
        propertyObject.website = request.payload.website;
      }
      // Contact doesn't require extra validation
      if (request.payload.hasOwnProperty('contact')) {
        propertyObject.contact = request.payload.contact;
      }
      // Body doesn't require extra validation
      if (request.payload.hasOwnProperty('body')) {
        propertyObject.body = request.payload.body;
      }
      // Create property using payload
      let updatedProperty = await propertyInstance.update(propertyObject);
      if (request.payload.hasOwnProperty('address')) {
        await updatedProperty.PostalAddresses[0].update(addressObject)
        await updatedProperty.GeoCoordinate.update(locationObject);
        return updatedProperty.reload();
      }
      return updatedProperty;
    },
    deleteProperty: function(request, h) {
      // User must be Super Admin to do this action
      if (request.auth.credentials.subjectId !== process.env.SUPER_ADMIN) {
        throw Boom.forbidden('Must have an Admin Account to delete a Property');
      }
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

  function getProperties(queryParams = {}) {
    return models.Property.findAll(getPropertyOptions(queryParams));
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

  function getAllPropertiesByMachineName(machineName) {
    return models.Property.findAll({
      where: {machineName: machineName},
      include: [
        {model: models.PostalAddress},
      ]
    });
  }

  async function createMachineName(name){
    const space = / /gi; //replaces spaces with -
    const replace = /[/,.()\[\]]/gi; // characters to replace in a machine name
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

  function getPropertyOptions(queryParams = {}) {
    let whereParams = {};
    let propertyOptions = {};
    propertyOptions.include = [
      {model: models.PostalAddress},
      {model: models.GeoCoordinates},
    ];
    // hasOwnProperty workaround because query object overwritten, see:
    // https://github.com/hapijs/hapi/issues/3280
    if (Object.prototype.hasOwnProperty.call(queryParams, 'search')) {
      // If there's a 'search' query param, we ignore the others and search
      // specific fields for that value
      propertyOptions.where = {
        [Op.or]: [
          {name: {[Op.iLike]: '%'+ queryParams.search +'%'}},
          {"$PostalAddresses.address$": {[Op.iLike]: '%'+ queryParams.search +'%'}}
        ]
      };
      return propertyOptions;
    }
    // else, no 'search' queryParam
    if (Object.prototype.hasOwnProperty.call(queryParams, 'name')) {
      whereParams.name = {
        [Op.iLike]: '%' + queryParams.name + '%',
      };
    }
    if (Object.prototype.hasOwnProperty.call(queryParams, 'bedrooms')) {
      whereParams.bedroomsMin = {
        [Op.lte]: queryParams.bedrooms,
      };
      whereParams.bedroomsMax = {
        [Op.gte]: queryParams.bedrooms,
      };
    }
    if (Object.prototype.hasOwnProperty.call(queryParams, 'locations')) {
      whereParams.LocationId = queryParams.locations;
    }
    if (Object.prototype.hasOwnProperty.call(queryParams, 'address')) {
      whereParams["$PostalAddresses.address$"] = {
        [Op.iLike]: '%' + queryParams.address + '%',
      };
    }
    if (Object.keys(whereParams).length !== 0) {
      propertyOptions.where = whereParams;
    }
    return propertyOptions;
  }

  function bothDefined (value1, value2) {
    let value1Defined = (value1 !== undefined && value1 !== null);
    let value2Defined = (value2 !== undefined && value2 !== null);
    let bothDefined = (value1Defined && value2Defined);
    return bothDefined;
  }

  function bothNull (value1, value2) {
    let bothNull = (value1 === null && value2 === null);
    return bothNull;
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

  async function ensureAccount(request) {
    let account;
    try {
      account = await accountLib.getAccount(request.auth.credentials);
    } catch (e) {
      throw Boom.badImplementation('Error during getAccount(request.auth.credentials). ' + e);
    }

    if (account === null) {
      throw Boom.badRequest('Must have an Account');
    }

    return account;
  }

  async function ensureAdmin(request) {
    if (request.auth.credentials.subjectId !== process.env.SUPER_ADMIN) {
      throw Boom.forbidden('Must be an Admin');
    }

    return true;
  }

};

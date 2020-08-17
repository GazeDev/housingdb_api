module.exports = (models) => {
  const Boom = require('boom');
  const Sequelize = require('sequelize');
  const Op = Sequelize.Op;
  const postalAddressLib = require('../postal-address/postal-address.controllers')(models).lib;
  const Log = require('../log/log.controllers')(models).lib;
  const accountLib = require('../account/account.controllers')(models).lib;
  const locationLib = require('../location/location.controllers')(models).lib;


  return {
    postExternalHousingAvailable: async function(request, h) {
      /*
        # Require Account for submitting fields, and location. 
        # Account also must be SUPER_ADMIN
      */
      let account;

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

      // External Housing Available Object 
      let externalHousingAvailableObject = {};

      let hasAddress = false;
      if (request.payload.hasOwnProperty("address")) {
        hasAddress = true;
      }

      let addressObject;
      
      if (hasAddress) {
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
          } catch (e) {}
          throw Boom.badData('No results for that address');
        } 

        const firstGeocode = geocodes.results[0];

        addressObject = postalAddressLib.extractAddress(firstGeocode);

        if (!addressObject.addressNumber) {
          try {
            await Log.request({
              type: 'externalhousingaddress.submit.failed.street_number',
              severity: 'Notice',
              request: request,
            });
          } catch (e) {}
          throw Boom.badData('Address is missing a street number');
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
        
        const addressHash = postalAddressLib.hashAddress(addressObject);
        addressObject.hash = addressHash;

        const existingAddresses = await postalAddressLib.getAddressesByHash(addressHash);
        if (existingAddresses.length > 0) {
          //If this is an exisiting address
          externalHousingAvailableObject.PropertyId = existingAddresses[0].PropertyId;
        } else {
          //Else, create a new propertyId for non exisiting address
        }

        const standardizedAddress = postalAddressLib.standardizeAddress(addressObject);
        addressObject.address = standardizedAddress; 
      }
      
      //Title
      if (request.payload.hasOwnProperty('title')) {
        externalHousingAvailableObject.title = request.payload.title;
      } 

      //AuthorId
      externalHousingAvailableObject.AuthorId = account.id;

      //Address
      if (request.payload.hasOwnProperty('address')) {
        externalHousingAvailableObject.address = request.payload.address;
      } 

      //Bedrooms
      if (request.payload.hasOwnProperty('bedrooms')) {
        let bedrooms = Number(request.payload.bedrooms); 
        externalHousingAvailableObject.bedrooms = bedrooms; 
      } 

      //Bathrooms
      if (request.payload.hasOwnProperty('bathrooms')) {
        let bathrooms = Number(request.payload.bathrooms);
        externalHousingAvailableObject.bathrooms = bathrooms;
      } 

      //Contacts 
      if (request.payload.hasOwnProperty('contact')) {
        externalHousingAvailableObject.contact = request.payload.contact;
      }

      //Body
      if (request.payload.hasOwnProperty('body')) {
        externalHousingAvailableObject.body = request.payload.body;
      }

      //Url
      if (request.payload.hasOwnProperty('url')) {
        externalHousingAvailableObject.url = request.payload.url;
      }

      //Status
      if (request.payload.hasOwnProperty('status')) {
        externalHousingAvailableObject.status = request.payload.status;
      } else {
        externalHousingAvailableObject.status = "active";
      }
      
      //Price
      if (request.payload.hasOwnProperty('price')) {
        externalHousingAvailableObject.price = request.payload.price;
      }

      if (hasAddress) {
        //belongsTo Location: 
        let locationTerms = [addressObject.addressRegion, addressObject.addressLocality];
        if (addressObject.hasOwnProperty('addressNeighborhood')) {
          locationTerms.push(addressObject.addressNeighborhood);
        } else {
          locationTerms.push(addressObject.addressLocality);
        }

        let locationId = await locationLib.locationFindCreateNestedTerms(locationTerms);
        externalHousingAvailableObject.LocationId = locationId;
      } 

      let externalHousingAvailable; 
      try {
        externalHousingAvailable = await createExternalHousingAvailable(externalHousingAvailableObject);
      } catch (e) {
        throw Boom.badImplementation(`Error occured during createExternalHousingAvailableHousing(externalHousingAvailableObject). ${e}`);
      }

      return h
        .response(externalHousingAvailable);
    }, 
    //Get ALL external housing available
    getAllExternalHousingAvailable: async function(request, h) {
      let returnAllExternalHousingAvailable;
      try {
        returnAllExternalHousingAvailable = await getAllExternalHousingAvailable(request.query);
      } catch (e) {
        throw Boom.badImplementation(`Error during getAllExternalHousingAvailable(). ${e}`);
      }
      return h
        .response(returnAllExternalHousingAvailable);
    },
    getOneExternalHousingAvailable: async function(request, h) {
      let returnOneExternalHousingAvailable;
      try {
        returnOneExternalHousingAvailable = await getOneExternalHousingAvailable(request.params.id);
      } catch (e) {
        throw Boom.badImplementation(`Error during getOneExternalHousingAvailable(). ${e}`);
      }
      return h
        .response(returnOneExternalHousingAvailable);
    },
  };

  function createExternalHousingAvailable(externalHousingAvailableObject) {
    return models.ExternalHousingAvailable.create(externalHousingAvailableObject);
  };

  function getAllExternalHousingAvailable(queryParams = {}) {
    return models.ExternalHousingAvailable.findAll(getAllExternalHousingAvailableOptions(queryParams));
  }

  function getOneExternalHousingAvailable(id) {
    return models.ExternalHousingAvailable.findByPk(id)
    .then(response => {
      return response;
    })
    .catch(error => {
      return error;
    });
  }

  function getAllExternalHousingAvailableOptions(queryParams = {}) {
    let whereParams = {};
    let externalHousingAvailableOptions = {};
    
    if (Object.prototype.hasOwnProperty.call(queryParams, 'title')) {
      whereParams.title = {
        [Op.iLike]: '%' + queryParams.title + '%',
      }
    }
    if (Object.prototype.hasOwnProperty.call(queryParams, 'address')) {
      whereParams.address = {
        [Op.iLike]: '%' + queryParams.address + '%',
      };
    } 
    if (Object.prototype.hasOwnProperty.call(queryParams, 'bedrooms')) {
      whereParams.bedrooms = {
        [Op.gte]: queryParams.bedrooms,
      };
    }
    if (Object.prototype.hasOwnProperty.call(queryParams, 'bathrooms')) {
      whereParams.bathrooms = {
        [Op.gte]: queryParams.bathrooms,
      };
    }
    if (Object.prototype.hasOwnProperty.call(queryParams, 'status')) {
      whereParams.status = {
        [Op.eq]: queryParams.status,
      };
    }
    if (Object.prototype.hasOwnProperty.call(queryParams, 'price')) {
      whereParams.price = {
        [Op.lte]: queryParams.price,
      };
    }
    if (Object.prototype.hasOwnProperty.call(queryParams, 'locations')) {
    /** 
     * We use an = instead of [Op.in] because sequelize can figure out whether it should use [Op.eq] or [Op.in] 
     * depending on whether it's passed a string or array, and this value could be either.
     * https://www.bennadel.com/blog/3302-you-can-use-arrays-in-field-equality-checks-within-a-sequelize-where-clause-in-node-js.htm
     */
      whereParams.LocationId = queryParams.locations;
    }
    if (Object.keys(whereParams).length !== 0) {
      externalHousingAvailableOptions.where = whereParams;
    }
    return externalHousingAvailableOptions;
  }
};

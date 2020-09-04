module.exports = (models) => {
  const Boom = require('@hapi/boom');
  return {
    getAddresses: async function(request, h) {
      let response;
      try {
        response = await models.PostalAddress.findAll();
      } catch (e) {
        throw Boom.badImplementation('Error during models.PostalAddress.findAll().', e);
      }
      return h.response(response);
    },
    getAddressesByHash: async function(request, h) {
      let response;
      try {
        response = await models.PostalAddress.findAll({
          raw: true,
          where: { 'hash': request.params.hash }
        });
      } catch (e) {
        throw Boom.badImplementation('Error during models.PostalAddress.findAll(...).', e);
      }
      return h.response(response);
    },
    deleteAddress: async function(request, h) {
      let response;
      try {
        response = await models.PostalAddress.destroy({
          where: {
            id: request.params.addressId,
          },
        });
      } catch (e) {
        throw Boom.badImplementation('Error during models.PostalAddress.destroy(...).', e);
      }
      return h
        .response(response)
        .code(202);
    },
    lib: {
      addressGeocode: addressGeocode,
      extractAddress: extractAddress,
      hashAddress: hashAddress,
      getAddressesByHash: getAddressesByHash,
      standardizeAddress: standardizeAddress,
      createAddress: createAddress,
    }
  };

  /*
   * Takes an address string and returns google array of geocode objects
   */
  function addressGeocode(address) {

    // return addressGeocodeGoogle(address);
    return addressGeocodeOpenCage(address);
  }

  function addressGeocodeGoogle(address) {
    const url = require('url');
    const https = require('https');

    const api = new URL(process.env.ADDRESS_API);
    const key = process.env.ADDRESS_API_KEY;

    api.searchParams.set('key', key);
    api.searchParams.set('address', address);

    return new Promise((resolve, reject) => {

      https.get(api, res => {
        res.setEncoding("utf8");
        let body = "";
        res.on("data", data => {
          body += data;
        });
        res.on("end", () => {
          body = JSON.parse(body);
          resolve(body);
        });
        res.on('error', error => {
          reject(error);
        });
      });

    });
  }

  function addressGeocodeOpenCage(address) {
    const url = require('url');
    const api = new URL(process.env.ADDRESS_API);

    let https;
    if (api.protocol == 'http:') {
      https = require('http');
    } else {
      https = require('https');
    }
    const key = process.env.ADDRESS_API_KEY;

    api.searchParams.set('key', key);
    api.searchParams.set('q', address);
    if (process.env.hasOwnProperty('GEO_BOUNDING')) {
      api.searchParams.set('bounds', process.env.GEO_BOUNDING);
    }

    return new Promise((resolve, reject) => {

      https.get(api, res => {
        res.setEncoding("utf8");
        let body = "";
        res.on("data", data => {
          body += data;
        });
        res.on("end", () => {
          body = JSON.parse(body);
          resolve(body);
        });
        res.on('error', error => {
          reject(error);
        });
      });

    });
  }

  /*
   * Takes a single geocode object and returns an address object
   */
  function extractAddress(geocode) {
    /* format mapping from geocode result format to our storage format */
    // return extractAddressGoogle(geocode);
    return extractAddressOpenCage(geocode);
  }

    function extractAddressGoogle(geocode) {
      const formatMapping = {
        // street_number: {
        //   format: 'short_name',
        //   mapTo: 'addressNumber',
        // },
        street_address: {
          format: 'short_name',
          mapTo: 'addressNumber',
        },
        route: {
          format: 'long_name',
          mapTo: 'addressRoute',
        },
        locality: {
          format: 'long_name',
          mapTo: 'addressLocality',
        },
        administrative_area_level_2: {
          format: 'long_name',
          mapTo: 'addressCounty'
        },
        // administrative_area_level_1: {
        //   format: 'short_name',
        //   mapTo: 'addressRegion',
        // },
        state_code: {
          format: 'short_name',
          mapTo: 'addressRegion',
        },
        country: {
          format: 'short_name',
          mapTo: 'addressCountry',
        },
        postal_code: {
          format: 'short_name',
          mapTo: 'postalCode',
        },
        // neighborhood: {
        //   format: 'long_name',
        //   mapTo: 'addressNeighborhood',
        // },
        sublocality: {
          format: 'long_name',
          mapTo: 'addressNeighborhood',
        },
        'ISO_3166-1_alpha-2': {
          format: 'short_name',
          mapTo: 'addressCountry'
        },
      };

      var components = geocode.address_components;
      // console.log(components);
      let addressParts = {};
      for (const component of components) {
        for (const componentType of component.types) {
          if (formatMapping.hasOwnProperty(componentType)) {
            let format = formatMapping[componentType].format;
            let mapTo = formatMapping[componentType].mapTo;
            addressParts[mapTo] = component[format];
          }
        }
      }

      addressParts.streetAddress = addressParts.addressNumber + ' ' + addressParts.addressRoute;

      return addressParts;
    }

    function extractAddressOpenCage(geocode) {
      const formatMapping = {
        house_number: {
          mapTo: 'addressNumber',
        },
        road: {
          mapTo: 'addressRoute',
        },
        city: {
          mapTo: 'addressLocality',
        },
        county: {
          mapTo: 'addressCounty'
        },
        state_code: {
          mapTo: 'addressRegion',
        },
        postcode: {
          mapTo: 'postalCode',
        },
        suburb: {
          mapTo: 'addressNeighborhood',
        },
        "ISO_3166-1_alpha-2": {
          mapTo: 'addressCountry'
        },
      };
      // We'll add together streetAddress separately
      let streetAddress = '';
      var components = geocode.components;
      let addressParts = {};
      for (const format in formatMapping) {
        if (!Object.prototype.hasOwnProperty.call(formatMapping, format)) {
          continue;
        }
        if (components.hasOwnProperty(format)) {
          let mapTo = formatMapping[format].mapTo;
          addressParts[mapTo] = components[format];
          // create streetAddress from house_number and road
          if (format == 'house_number') {
            streetAddress += components[format] + ' ';
          }
          if (format == 'road') {
            streetAddress += components[format];
          }
        }
      }
      addressParts['streetAddress'] = streetAddress;
      return addressParts;
    }
  /*
   * Takes an addressObject and returns an address hash string
   */
  function hashAddress(addressObject) {
    const crypto = require('crypto');
    const expectedParts = [
      'addressNumber',
      'addressRoute',
      // 'addressNeighborhood',
      'addressLocality',
      'addressRegion',
      'postalCode',
      'addressCountry'
    ];
    let string = '';
    for (let i = 0; i < expectedParts.length; i++) {
      let part = expectedParts[i];
      if (addressObject[part]) {
        if (i==0) {
          string += addressObject[part];
        }
        else {
          string += "_" + addressObject[part];
        }
      }
    }

    return crypto
             .createHash('md5')
             .update(string)
             .digest('hex');
  }

  /*
   * Takes an address hash and returns a boolean if it exists in the DB already
   */
  function getAddressesByHash(hash, raw = true) {
    return models.PostalAddress.findAll({
      raw: raw,
      where: {
        hash: hash,
      }
    });
  }

  /*
   * Takes an address object and returns a standardized address string
   */
  function standardizeAddress(addressObject) {
    const addressString =
      addressObject.addressNumber + ' ' +
      addressObject.addressRoute + ', ' +
      addressObject.addressLocality + ', ' +
      addressObject.addressRegion + ' ' +
      addressObject.postalCode;
    return addressString;
  }

  /*
   * Takes an address object with a propertyId and returns an address instance
   */
  function createAddress(addressObject) {
    return models.PostalAddress.create(addressObject)
  }

};

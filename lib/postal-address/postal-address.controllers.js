module.exports = (models) => {
  return {
    getAddresses: function(request, h) {
      return models.PostalAddress.findAll()
      .then(response => {
        return response;
      })
      .catch(error => {
        return error;
      });
    },
    getAddressesByHash: function(request, h) {
      return models.PostalAddress.findAll({
        raw: true,
        where: { 'hash': request.params.hash }
      })
      .then(response => {
        return response;
      })
      .catch(error => {
        return error;
      });
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

  /*
   * Takes a single geocode object and returns an address object
   */
  function extractAddress(geocode) {
    /* format mapping from geocode result format to our storage format */
    const formatMapping = {
      street_number: {
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
      administrative_area_level_1: {
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
      neighborhood: {
        format: 'long_name',
        mapTo: 'addressNeighborhood',
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

  /*
   * Takes an addressObject and returns an address hash string
   */
  function hashAddress(addressObject) {
    const crypto = require('crypto');
    const expectedParts = [
      'addressNumber',
      'addressRoute',
      'addressNeighborhood',
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
    })
    .then(response => {
      // console.log('addresses:');
      // console.log(response);
      return response;
    })
    .catch(error => {
      return error;
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
    .then(response => {
      return response;
    })
    .catch(error => {
      return error;
    });
  }

};

module.exports = (models) => {
  return {
    getGeoCoordinates: async function(request, h) {
      let response;
      try {
        response = await models.GeoCoordinates.findAll();
      } catch (e) {
        throw Boom.badImplementation('Error during models.GeoCoordinates.findAll().', e);
      }
      return h.response(response);
    },
    getGeoCoordinatesById: async function(request, h) {
      let response;
      try {
        response = await models.GeoCoordinates.findByPk(request.params.id)
      } catch (e) {
        throw Boom.badImplementation('Error during models.GeoCoordinates.findByPk(request.params.id).', e);
      }
      return h.response(response);
    },
    lib: {
      extractLocation: extractLocation,
      createLocation: createLocation,
    },

  };

  /*
   * Takes an location object with a propertyId and returns a location instance
   */
  function createLocation(locationObject) {
    return models.GeoCoordinates.create(locationObject);
  }

  /*
   * Takes a single geocode object and returns a location object
   */
  function extractLocation(geocode) {

    // return extractLocationGoogle(geocode);
    return extractLocationOpenCage(geocode);
  }

  function extractLocationGoogle(geocode) {
    let location = {};
    location.latitude = geocode.geometry.location.lat;
    location.longitude = geocode.geometry.location.lng;
    return location;
  }

  function extractLocationOpenCage(geocode) {
    let location = {};
    location.latitude = geocode.geometry.lat;
    location.longitude = geocode.geometry.lng;
    return location;
  }

};

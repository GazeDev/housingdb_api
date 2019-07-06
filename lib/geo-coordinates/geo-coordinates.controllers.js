module.exports = (models) => {
  return {
    getGeoCoordinates: function(request, h) {
      return models.GeoCoordinates.findAll()
      .then(response => {
        return response;
      })
      .catch(error => {
        return error;
      });
    },
    getGeoCoordinatesById: function(request, h) {
      return models.GeoCoordinates.findByPk(request.params.id)
      .then(response => {
        return response;
      })
      .catch(error => {
        return error;
      });
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
    return models.GeoCoordinates.create(locationObject)
    .then(response => {
      return response;
    })
    .catch(error => {
      return error;
    });
  }

  /*
   * Takes a single geocode object and returns a location object
   */
  function extractLocation(geocode) {
    let location = {};
    location.latitude = geocode.geometry.location.lat;
    location.longitude = geocode.geometry.location.lng;
    return location;
  }

};

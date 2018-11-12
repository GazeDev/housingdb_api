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
      return models.GeoCoordinates.findById(request.params.id)
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
    console.log("geocode");
    console.log(geocode.geometry);
    location.latitude = geocode.geometry.location.lat;
    location.longitude = geocode.geometry.location.lng;
    console.log("location");
    console.log(location);
    return location;
  }

};

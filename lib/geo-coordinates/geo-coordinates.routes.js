module.exports = {
  routes: (models) => {
    const controllers = require('./geo-coordinates.controllers')(models);
    const geoCoordinatesModels = require('./geo-coordinates.models');
    return [
      {
      	method: 'GET',
      	path: '/geo-coordinates',
        handler: controllers.getGeoCoordinates,
        config: {
          description: 'Get GeoCoordinates',
          notes: 'Returns all GeoCoordinates.',
          tags: ['api', 'GeoCoordinates'],
        }
      },
      {
        method: 'GET',
        path: '/geo-coordinates/{id}',
        handler: controllers.getGeoCoordinatesById,
        config: {
          description: 'Get GeoCoordinates by id',
          notes: 'Returns one set of GeoCoordinates.',
          tags: ['api', 'GeoCoordinates'],
          validate: {
            params: geoCoordinatesModels.id,
          }
        }
      },
    ];
  },
};

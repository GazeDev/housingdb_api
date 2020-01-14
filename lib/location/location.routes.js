module.exports = {
  routes: (models) => {
    const controllers = require('./location.controllers')(models);
    const locationModels = require('./location.models');
    return [
      {
        method: 'GET',
        path: '/locations',
        handler: controllers.getLocations,
        config: {
          description: 'Get Locations',
          notes: 'Returns all Locations.',
          tags: ['api', 'Location'],
        }
      },
      {
        method: 'GET',
        path: '/locations/{id}',
        handler: controllers.getLocation,
        config: {
          description: 'Get Location by Id',
          notes: 'Returns a specific Location by Id.',
          tags: ['api', 'Location'],
          validate: {
            params: locationModels.id,
          }
        }
      },
    ];
  },
};

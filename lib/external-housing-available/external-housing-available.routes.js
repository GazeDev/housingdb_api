module.exports = {
  routes: (models) => {
    const controllers = require('./external-housing-available.controllers')(models);
    const externalHousingAvailableModels = require('./external-housing-available.models');
    return [
      {
        method: 'POST',
        path: '/external-housing-available',
        config: {
          auth: 'jwt',
          handler: controllers.postExternalHousingAvailable,
          description: 'Create External Housing Available',
          notes: 'Create an external housing available in the database.',
          tags: ['api', 'External Housing Available'],
          validate: {
            payload: externalHousingAvailableModels.api,
          }
        }
      },
      {
        method: 'GET',
        path: '/external-housing-available',
        handler: controllers.getAllExternalHousingAvailable,
        config: {
          auth: 'jwt',
          description: 'Get External Housing Available',
          notes: 'Returns all external housing available.',
          tags: ['api', 'External Housing Available'],
          validate: {
            query: externalHousingAvailableModels.apiFilterQuery,
          }
        }
      },
    ];
  },
};

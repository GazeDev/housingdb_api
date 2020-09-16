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
      {
        method: 'GET',
        path: '/external-housing-available/{id}',
        handler: controllers.getOneExternalHousingAvailable,
        config: {
          auth: 'jwt',
          description: 'Get one External Housing Available by Id',
          notes: 'Returns one external housing available.',
          tags: ['api', 'External Housing Available'],
          validate: {
            params: externalHousingAvailableModels.id,
          }
        }
      },
      {
        method: 'DELETE',
        path: '/external-housing-available/{id}',
        config: {
          auth: 'jwt',
          handler: controllers.deleteExternalHousingAvailable,
          description: 'Delete External Housing Available',
          notes: 'Deletes a external housing available from the database.',
          tags: ['api', 'External Housing Available'],
          validate: {
            params: externalHousingAvailableModels.id,
          }
        }
      },
    ];
  },
};

module.exports = {
  routes: (models) => {
    const controllers = require('./external-housing-available.controllers')(models);
    const externalHousingAvailableModels = require('./external-housing-available.models');
    return [
      {
        method: 'POST',
        path: '/external-housing-available',
        config: {
          handler: controllers.postExternalHousingAvailable,
          description: 'Create External Housing Available',
          notes: 'Create an external housing available in the database.',
          tags: ['api', 'External Housing Available'],
          validate: {
            payload: externalHousingAvailableModels.api,
          }
        }
      },
    ];
  },
};

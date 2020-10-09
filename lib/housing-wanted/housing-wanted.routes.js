module.exports = {
  routes: (models) => {
    const controllers = require('./housing-wanted.controllers')(models);
    const housingWantedModels = require('./housing-wanted.models');
    return [
      {
        method: 'POST',
        path: '/housing-wanted',
        config: {
          auth: 'jwt',
          handler: controllers.postHousingWanted,
          description: 'Create Housing Wanted',
          notes: 'Create a housing wanted in the database.',
          tags: ['api', 'HousingWanted'],
          validate: {
            payload: housingWantedModels.api,
          }
        }
      },
    ];
  },
};

module.exports = {
  routes: (models) => {
    const controllers = require("./housing-available.controllers")(models);
    const housingAvailableModels = require("./housing-available.models");
    return [
      {
        method: 'POST',
        path: '/housing-available',
        config: {
          auth: 'jwt',
          handler: controllers.postHousingAvailable,
          description: 'Create new "Housing Available" Listing',
          notes: 'Create a new Housing Available rental listing in the database.',
          tags: ['api', 'HousingAvailable'],
          validate: {
            payload: housingAvailableModels.api,
          },
        },
      },
      {
        method: 'GET',
        path: '/housing-available',
        handler: controllers.getHousingAvailable,
        config: {
          auth: 'jwt',
          description: 'Get Housing Available',
          notes: 'Returns all Housing Availables.',
          tags: ['api', 'HousingAvailable'],
        }
      },
    ];
  }
};

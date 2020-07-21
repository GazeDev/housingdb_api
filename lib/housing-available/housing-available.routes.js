module.exports = {
  routes: (models) => {
    const controllers = require('./housing-available.controllers')(models);
    const housingAvailableModels = require('./housing-available.models')(models);
    const landlordModels = require('./landlord/landlord.models')(models);
    const propertyModels = require(`./property/property.models`)(models);
    return [
      {
        method: 'POST',
        path: '/housing-available/create',
        config: {
          handler: controllers.postHousingAvailable,  // TODO: create postHousingAvailable method in .controllers;
          description: 'Create New Housing Available Listing',
          notes: 'Create a new Housing Available rental listing in the database.',
          tags: ['api', 'HousingAvailable'],
          validate: {
            payload: housingAvailableModels.api,
          },
        },
      },  
    ];
  }
};
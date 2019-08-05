module.exports = {
  routes: (models) => {
    const controllers = require('./landlord.controllers')(models);
    const landlordModels = require('./landlord.models');
    const propertyModels = require('../property/property.models');
    return [


      {
      	method: 'GET',
      	path: '/landlords',
        handler: controllers.getLandlords,
        config: {
          description: 'Get Landlords',
          notes: 'Returns all landlords.',
          tags: ['api', 'Landlords'],
        }
      },
      {
        method: 'GET',
        path: '/landlords/{id}',
        handler: controllers.getLandlord,
        config: {
          description: 'Get Landlord by Id',
          notes: 'Returns one landlord.',
          tags: ['api', 'Landlords'],
          validate: {
            params: landlordModels.id,
          }
        }
      },
      {
      	method: 'GET',
      	path: '/landlords/schema',
        config: {
          handler: controllers.getLandlordsSchema,
          description: 'Get Landlords Schema',
          notes: 'Returns the json schema for a landlord.',
          tags: ['api', 'Landlords'],
        }
      },
      {
        method: 'POST',
        path: '/landlords',
        config: {
          handler: controllers.postLandlord,
          description: 'Create Landlord',
          notes: 'Create a landlord in the database.',
          tags: ['api', 'Landlords'],
          validate: {
            payload: landlordModels.api,
          }
        }
      },
      {
        method: 'DELETE',
        path: '/landlords/{id}',
        config: {
          handler: controllers.deleteLandlord,
          description: 'Delete Landlord',
          notes: 'Deletes a landlord from the database.',
          tags: ['api', 'Landlords'],
          validate: {
            params: landlordModels.id,
          }
        }
      },
      // {
      //   method: 'POST',
      //   path: '/landlords/properties',
      //   config: {
      //     handler: controllers.postLandlordProperty,
      //     description: 'Create Property',
      //     notes: 'Create a property with an optional landlord.',
      //     tags: ['api', 'Landlords'],
      //     validate: {
      //       payload: landlordModels.landlordPropertyApi,
      //     }
      //   }
      // },
      {
        method: 'POST',
        path: '/properties/{id}/landlord',
        config: {
          handler: controllers.addLandlordToProperty,
          description: 'Attach Landlord to Property',
          notes: 'Attach a landlord to a property',
          tags: ['api', 'Landlords'],
          validate: {
            params: propertyModels.id,
            payload: landlordModels.id,
          }
        }
      },
      {
        method: 'GET',
        path: '/landlords/{id}/properties',
        handler: controllers.getLandlordProperties,
        config: {
          description: 'Get PRoperties by Landlord Id',
          notes: 'Returns all properties for a landlord.',
          tags: ['api', 'Landlords'],
          validate: {
            params: landlordModels.id,
          }
        }
      },


    ];
  },
};

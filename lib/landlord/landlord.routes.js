module.exports = {
  routes: (models) => {
    const controllers = require('./landlord.controllers')(models);
    const landlordModels = require('./landlord.models');
    const propertyModels = require('../property/property.models');
    return [
      {
        method: 'PATCH',
        path: '/admin/landlords/machine-name/generate',
        handler: controllers.adminGenerateMachineNames,
        config: {
          auth: 'jwt',
          description: 'Generate Landlords Machine Names',
          notes: 'Generate Machine Names for all Landlords without Machine Name.',
          tags: ['Admin', 'api',  'Landlords'],
        }
      },
      {
        method: 'GET',
        path: '/landlords',
        handler: controllers.getLandlords,
        config: {
          description: 'Get Landlords',
          notes: 'Returns all landlords.',
          tags: ['api', 'Landlords'],
          validate: {
            query: landlordModels.apiFilterQuery,
          }
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
        path: '/landlords/machine-name/{machineName}',
        handler: controllers.getLandlordByMachineName,
        config: {
          description: 'Get Landlord by Machine Name',
          notes: 'Returns one landlord using machine name.',
          tags: ['api', 'Landlords'],
          validate: {
            params: landlordModels.machineName,
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
        method: 'PATCH',
        path: '/landlords/{id}',
        config: {
          auth: 'jwt',
          handler: controllers.patchLandlord,
          description: 'Update a Landlord',
          notes: 'Update a landlord in the database.',
          tags: ['api', 'Landlords'],
          validate: {
            params: landlordModels.id,
            payload: landlordModels.apiPatch,
          }
        }
      },
      {
        method: 'DELETE',
        path: '/landlords/{id}',
        config: {
          auth: 'jwt',
          handler: controllers.deleteLandlord,
          description: 'Delete Landlord',
          notes: 'Deletes a landlord from the database.',
          tags: ['api', 'Landlords'],
          validate: {
            params: landlordModels.id,
          }
        }
      },
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
          description: 'Get Properties by Landlord Id',
          notes: 'Returns all properties for a landlord.',
          tags: ['api', 'Landlords'],
          validate: {
            params: landlordModels.id,
            query: landlordModels.propertyApiFilterQuery,
          }
        }
      },
      {
        method: 'GET',
        path: '/accounts/landlords',
        config: {
          auth: 'jwt',
          handler: controllers.getAccountLandlords,
          description: 'Get Own Landlords',
          notes: 'Get the Landlords for the currently authd user from the database.',
          tags: ['api', 'Accounts', 'Landlords'],
        }
      },

    ];
  },
};

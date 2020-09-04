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
        options: {
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
        options: {
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
        options: {
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
        options: {
          description: 'Get Landlord by Machine Name',
          notes: 'Returns one landlord using machine name.',
          tags: ['api', 'Landlords'],
          validate: {
            params: landlordModels.machineName,
          }
        }
      },
      {
        method: 'POST',
        path: '/landlords',
        options: {
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
        options: {
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
        options: {
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
        options: {
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
        options: {
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
        options: {
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

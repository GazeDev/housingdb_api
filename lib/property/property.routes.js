module.exports = {
  routes: (models) => {
    const controllers = require('./property.controllers')(models);
    const propertyModels = require('./property.models');
    return [
      {
        method: 'PATCH',
        path: '/admin/properties/machine-name/generate',
        handler: controllers.adminGenerateMachineNames,
        config: {
          description: 'Generate Properties Machine Names',
          notes: 'Generate Machine Names for all Properties without Machine Name.',
          tags: ['Admin', 'api',  'Properties'],
        }
      },
      {
        method: 'GET',
        path: '/properties',
        handler: controllers.getProperties,
        config: {
          description: 'Get Properties',
          notes: 'Returns all properties.',
          tags: ['api', 'Properties'],
          validate: {
            query: propertyModels.apiFilterQuery,
          }
        }
      },
      {
        method: 'GET',
        path: '/properties/{id}',
        handler: controllers.getProperty,
        config: {
          description: 'Get Property by Id',
          notes: 'Returns one property.',
          tags: ['api', 'Properties'],
          validate: {
            params: propertyModels.id,
          }
        }
      },
      {
        method: 'GET', //by machine name
        path: '/properties/machine-name/{machineName}',
        handler: controllers.getPropertyByMachineName,
        config: {
          description: 'Get Property by Machine Name',
          notes: 'Returns one property using machine name.',
          tags: ['api', 'Properties'],
          validate: {
            params: propertyModels.machineName,
          }
        }
      },
      {
        method: 'GET',
        path: '/properties/schema',
        config: {
          handler: controllers.getPropertiesSchema,
          description: 'Get Properties Schema',
          notes: 'Returns the json schema for a property.',
          tags: ['api', 'Properties'],
        }
      },
      {
        method: 'POST',
        path: '/properties',
        config: {
          handler: controllers.postProperty,
          description: 'Create Property',
          notes: 'Create a property in the database.',
          tags: ['api', 'Properties'],
          validate: {
            payload: propertyModels.api,
          }
        }
      },
      {
        method: 'PATCH',
        path: '/properties/{id}',
        config: {
          auth: 'jwt',
          handler: controllers.patchProperty,
          description: 'Update a Property',
          notes: 'Updates a property from the database.',
          tags: ['api', 'Properties'],
          validate: {
            params: propertyModels.id,
            payload: propertyModels.apiPatch,
          }
        }
      },
      {
        method: 'DELETE',
        path: '/properties/{id}',
        config: {
          auth: 'jwt',
          handler: controllers.deleteProperty,
          description: 'Delete Property',
          notes: 'Deletes a property from the database.',
          tags: ['api', 'Properties'],
          validate: {
            params: propertyModels.id,
          }
        }
      },
      {
        method: 'GET',
        path: '/accounts/properties',
        config: {
          auth: 'jwt',
          handler: controllers.getAccountProperties,
          description: 'Get Own Properties',
          notes: 'Get the Properties for the currently authd user from the database.',
          tags: ['api', 'Accounts', 'Properties'],
        }
      },

    ];
  },
};

module.exports = {
  routes: (models) => {
    const controllers = require('./property.controllers')(models);
    const propertyModels = require('./property.models');
    return [


      {
        method: 'GET',
        path: '/properties',
        handler: controllers.getProperties,
        config: {
          description: 'Get Properties',
          notes: 'Returns all properties.',
          tags: ['api', 'Properties'],
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
        method: 'DELETE',
        path: '/properties/{id}',
        config: {
          handler: controllers.deleteProperty,
          description: 'Delete Property',
          notes: 'Deletes a property from the database.',
          tags: ['api', 'Properties'],
          validate: {
            params: propertyModels.id,
          }
        }
      },


    ];
  },
};

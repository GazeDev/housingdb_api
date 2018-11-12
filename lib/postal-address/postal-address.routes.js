module.exports = {
  routes: (models) => {
    const controllers = require('./postal-address.controllers')(models);
    const postalAddressModels = require('./postal-address.models');
    return [
      {
      	method: 'GET',
      	path: '/addresses',
        handler: controllers.getAddresses,
        config: {
          description: 'Get Addresses',
          notes: 'Returns all addresses.',
          tags: ['api', 'Postal Addresses'],
        }
      },
      {
        method: 'GET',
        path: '/addresses/{hash}',
        handler: controllers.getAddressesByHash,
        config: {
          description: 'Get Address by hash',
          notes: 'Returns one address.',
          tags: ['api', 'Postal Addresses'],
          validate: {
            params: postalAddressModels.apiHash,
          }
        }
      },
    ];
  },
};

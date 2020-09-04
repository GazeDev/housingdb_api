module.exports = {
  routes: (models) => {
    const helpers = require('../helpers')(models);
    const controllers = require('./postal-address.controllers')(models);
    const postalAddressModels = require('./postal-address.models');
    return [
      {
      	method: 'GET',
      	path: '/addresses',
        handler: controllers.getAddresses,
        options: {
          description: 'Get Addresses',
          notes: 'Returns all addresses.',
          tags: ['api', 'Postal Addresses'],
        }
      },
      {
        method: 'GET',
        path: '/addresses/{hash}',
        handler: controllers.getAddressesByHash,
        options: {
          description: 'Get Address by hash',
          notes: 'Returns one address.',
          tags: ['api', 'Postal Addresses'],
          validate: {
            params: postalAddressModels.apiHash,
          }
        }
      },
      {
        method: 'DELETE',
        path: '/addresses/{addressId}',
        handler: controllers.deleteAddress,
        options: {
          auth: 'jwt',
          pre: [
            { method: helpers.ensureAdmin, failAction: 'error' },
          ],
          description: 'Delete Address by id',
          notes: 'Deletes an address from the database.',
          tags: ['api', 'Postal Addresses'],
          validate: {
            params: postalAddressModels.id,
          }
        }
      },
    ];
  },
};

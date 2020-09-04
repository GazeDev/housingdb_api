module.exports = {
  routes: (models) => {
    const helpers = require('../helpers')(models);
    const controllers = require('./account.controllers')(models);
    const accountModels = require('./account.models');
    return [
      {
        method: 'GET',
        path: '/accounts',
        handler: controllers.getAccount,
        options: {
          auth: 'jwt',
          description: 'Get Current Authentication Account',
          notes: 'Get the account associated with the current authentication',
          tags: ['api', 'Accounts'],
        }
      },
      // {
      //   method: 'GET',
      //   path: '/accounts',
      //   handler: controllers.getAccounts,
      //   options: {
      //     auth: 'jwt',
      //     description: 'Get Account',
      //     notes: 'Get A list of all accounts in the system',
      //     tags: ['api', 'Accounts'],
      //   }
      // },
      {
        method: 'POST',
        path: '/accounts',
        handler: controllers.postAccount,
        options: {
          auth: 'jwt',
          description: 'Create Account',
          notes: 'create a account and receive the account object in return',
          tags: ['api', 'Accounts'],
          // validate: {
          //   payload: accountModels.api,
          // }
        },
      },
      {
        method: 'PATCH',
        path: '/accounts/{accountId}',
        options: {
          auth: 'jwt',
          pre: [
            { method: helpers.ensureAccount, assign: 'account', failAction: 'error' },
          ],
          handler: controllers.patchAccount,
          description: 'Update an Account',
          notes: 'Update an Account in the database.',
          tags: ['api', 'Accounts'],
          validate: {
            params: accountModels.id,
            payload: accountModels.apiPatch,
          }
        }
      },
      // {
      //   method: 'DELETE',
      //   path: '/accounts/{id}',
      //   options: {
      //     handler: controllers.deleteAccount,
      //     description: 'Delete Account',
      //     notes: 'delete a account',
      //     tags: ['api', 'Accounts'],
      //     validate: {
      //       params: accountModels.id,
      //     }
      //   }
      // },
    ];
  },
};

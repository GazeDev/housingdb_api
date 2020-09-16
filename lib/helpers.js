const Boom = require('@hapi/boom');

module.exports = (models) => {
  let accountLib = require('./account/account.controllers.js')(models).lib;
  return {
    ensureAdmin: async function(request) {
      if (
        // if SUPER_ADMIN is undefined or empty
        !process.env.SUPER_ADMIN ||
        request.auth.credentials.subjectId !== process.env.SUPER_ADMIN
      ) {
        throw Boom.forbidden('Must be an Admin');
      }
      return true;
    },
    ensureAccount: async function(request) {
      let account;
      try {
        account = await accountLib.getAccount(request.auth.credentials);
      } catch (e) {
        throw Boom.badImplementation('Error during getAccount(request.auth.credentials). ' + e);
      }

      if (account === null) {
        throw Boom.badRequest('Must have an Account');
      }

      return account;
    },
  };
};

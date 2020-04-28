module.exports = (models) => {
  const Boom = require('boom');

  return {
    getAccount: async function(request, h) {
      let externalId = request.auth.credentials.subjectId;
      let account;
      try {
        account = await getAccount(request.auth.credentials);
      } catch (e) {
        throw Boom.badImplementation('Error during getAccount(request.auth.credentials). ' + e);
      }

      if (account === null) {
        throw Boom.notFound("No account found for the provided credentials.");
      }

      return account;
    },
    // getAccounts: async function(request, h) {
    //   return models.Account.findAll()
    //   .then(response => {
    //     return response;
    //   })
    //   .catch(error => {
    //     return error;
    //   });
    // },
    postAccount: async function(request, h) {
      let credentials = request.auth.credentials;

      let account;
      try {
        account = await getAccount(credentials);
      } catch (e) {
        throw Boom.badImplementation('Error during postAccount - getAccount(credentials). ' + e);
      }

      if (account !== null) {
        throw Boom.conflict("Account already exists for provided credentials");
      }

      return models.Account.create({
        externalId: credentials.subjectId,
      })
      .then(response => {
        return response;
      })
      .catch(error => {
        return error;
      });
    },
    patchAccount: async function(request, h) {
      let account = request.payload;
      let accountId = request.params.accountId;
      let credentials = request.auth.credentials;
      // Ensure the current user has an account
      let currentAccount = await ensureAccount(request);
      // Check to see that the current account matches the proposed patched account
      // or that the user is the superadmin
      if (
        currentAccount.id !== accountId &&
        !isAdmin(request)
      ) {
        throw Boom.conflict("Current account does not match the one being patched");
      }
      // Make sure proposed patched account exists
      let accountInstance;
      try {
        accountInstance = await getAccountById(accountId);
        if (accountInstance === null) {
          throw Boom.badRequest('Account does not exist');
        }
      } catch (e) {
        throw Boom.badImplementation('Error during update account. ' + e);
      }
      // update only the userData field of the account, to limit potential exploits
      let updatedAccount;
      try {
        // NOTE: this replaces the whole account userData field with userData
        // passed by the user; essentially acting as a PUT for userData field
        updatedAccount = await accountInstance.update({
          userData: account.userData,
        });
      } catch (e) {
        throw Boom.badImplementation('Error during update account. ' + e);
      }
      return updatedAccount;
    },
    // deleteAccount: function(request, h) {
    //   return models.Account.destroy({
    //     where: {
    //       id: request.params.id,
    //     },
    //   })
    //   .then(response => {
    //     return h
    //     .response(response)
    //     .code(202);
    //   })
    //   .catch(error => {
    //     return error;
    //   });
    // },
    lib: {
      getAccount: getAccount,
      ensureAccount: ensureAccount,
    },
  };

  // getCurrentAccount based off auth credentials
  function getAccount(credentials) {
    return models.Account.findOne({
      where: {
        externalId: credentials.subjectId,
      }
    })
  }

  function getAccountById(accountId) {
    return models.Account.findByPk(accountId);
  }

  async function ensureAccount(request) {
    let account;
    try {
      account = await getAccount(request.auth.credentials);
    } catch (e) {
      throw Boom.badImplementation('Error during getAccount(request.auth.credentials). ' + e);
    }

    if (account === null) {
      throw Boom.badRequest('Must have an Account');
    }

    return account;
  }

  function isAdmin(request) {
    if (request.auth.credentials.subjectId === process.env.SUPER_ADMIN) {
      return true;
    }
    return false;
  }


};

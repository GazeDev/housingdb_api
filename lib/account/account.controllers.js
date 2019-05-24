module.exports = (models) => {
  const Boom = require('boom');
  
  return {
    getAccount: async function(request, h) {
      let externalId = request.auth.credentials.subjectId;
      console.log('externalId', externalId);
      let account;
      try {
        account = await getAccount(request.auth.credentials);
      } catch (e) {
        throw Boom.badImplementation('Error during getAccount(request.auth.credentials). ' + e);
      }

      console.log('account', account);
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

      console.log('externalId', credentials.subjectId);
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
    },
  };


  function getAccount(credentials) {
    return models.Account.findOne({
      where: {
        externalId: credentials.subjectId,
      }
    })
    .then(response => {
      return response;
    })
    .catch(error => {
      return error;
    });
  }

};

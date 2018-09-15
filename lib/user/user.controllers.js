
module.exports = (models) => {
  return {
    getUsers: async function(request, h) {
      return models.User.findAll()
      .then(response => {
        return response;
      })
      .catch(error => {
        return error;
      });
    },
    postUser: function(request, h) {
      return models.User.create(request.payload)
      .then(response => {
        return response;
      })
      .catch(error => {
        return error;
      });
    },
    deleteUser: function(request, h) {
      return models.User.destroy({
        where: {
          id: request.params.id,
        },
      })
      .then(response => {
        return h
        .response(response)
        .code(202);
      })
      .catch(error => {
        return error;
      });
    },
    lib: {
      getUser: function (userId) {
        return models.User.findById(userId)
      }
    },
  };

};

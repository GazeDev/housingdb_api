module.exports = (models) => {
  return {
    getPersons: async function(request, h) {
      return models.Person.findAll()
      .then(response => {
        return response;
      })
      .catch(error => {
        return error;
      });
    },
    postPerson: function(request, h) {
      return models.Person.create(request.payload)
      .then(response => {
        return response;
      })
      .catch(error => {
        return error;
      });
    },
    deletePerson: function(request, h) {
      return models.Person.destroy({
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
      getPerson: function (userId) {
        return models.Person.findById(userId)
      }
    },
  };

};

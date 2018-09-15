
module.exports = (models) => {
  const userLib = require('../user/user.controllers')(models).lib;
  return {
    getTasks: async function(request, h) {
      let tasks;
      try {
        tasks = await getTasks();
      } catch (err) {
        return h
          .response({ err: err })
          .code(500);
      }
      return tasks;
    },
    postUserTask: async function(request, h) {
      let user;
      try {
        user = await userLib.getUser(request.params.userId);
      } catch (err) {
        return h
          .response({ err: err })
          .code(500);
      }

      if (!user) {
        return h
          .response({ err: "User does not exist." })
          .code(404);
      }

      request.payload.UserId = request.params.userId;

      const task = await models.Task.create(request.payload)
        .then(response => {
          return response;
        })
        .catch(error => {
          return error;
        });

      return task;

    },
    deleteUserTask: async function(request, h) {
      const user = await userLib.getUser(request.params.userId);

      if (!user) {
        return h
          .response({ err: 'user does not exist' })
          .code(404);
      }

      return models.Task.destroy({
        where: {
          id: request.params.taskId,
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
      getTasks: getTasks,
    }
  };

  function getTasks() {
    return models.Task.findAll()
    .then(response => {
      return response;
    })
    .catch(error => {
      return error;
    });
  }

};

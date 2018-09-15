
module.exports = {
  routes: (models) => {
    console.log('routes file loaded');
    const controllers = require('./user.controllers')(models);
    const userModels = require('./user.models');
    return [
      {
        method: 'GET',
        path: '/users',
        handler: controllers.getUsers,
        config: {
          description: 'Get Users',
          notes: 'Get A list of all users in the system',
          tags: ['api', 'users'],
        }
      },
      {
        method: 'POST',
        path: '/users',
        handler: controllers.postUser,
        options: {
          description: 'Create User',
          notes: 'create a user and receive the user object in return',
          tags: ['api', 'users'],
          validate: {
            payload: userModels.api,
          }
        },
      },
      {
        method: 'DELETE',
        path: '/users/{id}',
        config: {
          handler: controllers.deleteUser,
          description: 'Delete User',
          notes: 'delete a user',
          tags: ['api', 'users'],
          validate: {
            params: userModels.id,
          }
        }
      },
    ];
  },
};

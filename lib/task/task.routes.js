module.exports = {
  routes: (models) => {
    console.log('routes file loaded');
    const Joi = require('joi');
    const userModels = require('../user/user.models');
    const taskModels = require('./task.models');
    const controllers = require('./task.controllers')(models);
    return [
      {
        method: 'GET',
        path: '/tasks',
        handler: controllers.getTasks,
        options: {
          description: 'Get Tasks',
          notes: 'Get A list of all tasks in the system',
          tags: ['api', 'tasks'],
        }
      },
      {
        method: 'POST',
        path: '/users/{userId}/tasks',
        handler: controllers.postUserTask,
        options: {
          description: 'Create Assigned Task',
          notes: 'create a task for a user and receive the task object in return',
          tags: ['api', 'tasks'],
          validate: {
            params: {
              userId: Joi.string().guid(),
            },
            payload: taskModels.api,
          }
        },
      },
      {
        method: 'DELETE',
        path: '/users/{userId}/tasks/{taskId}',
        handler: controllers.deleteUserTask,
        options: {
          description: 'Delete Assigned Task',
          notes: 'delete a task for a user and receive the number of deletions in return',
          tags: ['api', 'tasks'],
          validate: {
            params: {
              userId: Joi.string().guid(),
              taskId: Joi.string().guid(),
            }
          }
        },
      }

    ];
  },
};

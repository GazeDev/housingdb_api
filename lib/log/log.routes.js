module.exports = {
  routes: (models) => {
    const helpers = require('../helpers')(models);
    const controllers = require('./log.controllers')(models);
    const logModels = require('./log.models');
    return [
      {
        method: 'GET',
        path: '/logs',
        handler: controllers.getLogs,
        options: {
          auth: 'jwt',
          pre: [
            { method: helpers.ensureAdmin, failAction: 'error' },
          ],
          description: 'Get Logs',
          notes: 'Get the logs that have been saved to the database',
          tags: ['api', 'Logs'],
        }
      },
      {
        method: 'GET',
        path: '/logs/{id}',
        handler: controllers.getLog,
        options: {
          auth: 'jwt',
          pre: [
            { method: helpers.ensureAdmin, failAction: 'error' },
          ],
          description: 'Get Log by ID',
          notes: 'Get a single log by id.',
          tags: ['api', 'Logs'],
          validate: {
            params: logModels.id,
          }
        }
      },
      // {
      //   method: 'POST',
      //   path: '/logs/{id}/replay',
      //   handler: controllers.replayLog,
      //   options: {
      //     auth: 'jwt',
      //     pre: [
      //       { method: helpers.ensureAdmin, failAction: 'error' },
      //     ],
      //     description: 'Replay Log by ID',
      //     notes: 'replay a single log by id.',
      //     tags: ['api', 'Logs'],
      //     validate: {
      //       params: logModels.id,
      //     }
      //   }
      // },
    ];
  },
};

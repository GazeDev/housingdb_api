module.exports = {
  routes: (models) => {
    const controllers = require('./log.controllers')(models);
    const logModels = require('./log.models');
    return [
      {
        method: 'GET',
        path: '/logs',
        handler: controllers.getLogs,
        config: {
          auth: 'jwt',
          description: 'Get Logs',
          notes: 'Get the logs that have been saved to the database',
          tags: ['api', 'Logs'],
        }
      },
      {
        method: 'GET',
        path: '/logs/{id}',
        handler: controllers.getLog,
        config: {
          auth: 'jwt',
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
      //   config: {
      //     auth: 'jwt',
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

module.exports = {
  routes: (models) => {
    console.log('routes file loaded');
    const controllers = require('./person.controllers')(models);
    const personModels = require('./person.models');
    return [
      {
        method: 'GET',
        path: '/persons',
        handler: controllers.getPersons,
        config: {
          description: 'Get Person',
          notes: 'Get A list of all persons in the system',
          tags: ['api', 'Persons'],
        }
      },
      {
        method: 'POST',
        path: '/persons',
        handler: controllers.postPerson,
        options: {
          description: 'Create Person',
          notes: 'create a person and receive the person object in return',
          tags: ['api', 'Persons'],
          validate: {
            payload: personModels.api,
          }
        },
      },
      {
        method: 'DELETE',
        path: '/persons/{id}',
        config: {
          handler: controllers.deletePerson,
          description: 'Delete Person',
          notes: 'delete a person',
          tags: ['api', 'Persons'],
          validate: {
            params: personModels.id,
          }
        }
      },
    ];
  },
};

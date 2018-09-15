const { expect } = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Joi = require('joi');

lab.experiment('Task', () => {
  let server;
  let sequelize;
  let userModels;
  let taskModels;
  let userId;
  let taskId;

  lab.before(async() => {
    const index = await require('../../index.js');
    server = await index.server;
    sequelize = await index.sequelize;
    taskModels = require('./task.models');
    userModels = require('../user/user.models');
  });


  lab.test('Pretest: POST /users', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'POST',
      url: '/users',
      payload: {
        'username': 'Task User',
      }
    });

    const payload = JSON.parse(response.payload);

    expect(payload.username).to.equal('Task User');
    // save the userId for later so we can clean up
    userId = payload.id;
  });


  lab.test('POST /users/{userId}/tasks', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'POST',
      url: `/users/${userId}/tasks`,
      payload: {
        title: 'First Task',
      }
    });
    expect(response.statusCode).to.equal(200);

    const payload = JSON.parse(response.payload);

    expect(payload.title).to.equal('First Task');
    // save the userId for later so we can clean up
    taskId = payload.id;

    // We need to combine api schema and id schema for return payload schema
    const payloadSchema = Joi.object().keys({
      id: Joi.string().guid().required(),
      title: Joi.string().required(),
      UserId: Joi.string().guid().required(),
      updatedAt: Joi.string().required(),
      createdAt: Joi.string().required(),
    });
    const validateStatus = Joi.validate(payload, payloadSchema);

    expect(validateStatus.error).to.equal(null);
  });


  lab.test('DELETEs /users/{userId}/tasks/{taskId}', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'DELETE',
      url: `/users/${userId}/tasks/${taskId}`
    });

    const payload = JSON.parse(response.payload);
    // one row should have been affected
    expect(payload).to.equal(1);
    expect(response.statusCode).to.equal(202);
  });

  lab.test('Posttest: DELETEs /user/{userId}', async () => {

    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'DELETE',
      url: `/users/${userId}`,
    });

    const payload = JSON.parse(response.payload);
    // one row should have been affected
    expect(payload).to.equal(1);
    expect(response.statusCode).to.equal(202);
  });

});

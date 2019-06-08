const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const lab = exports.lab = Lab.script();
const Joi = require('joi');

lab.experiment('User', () => {
  let server;
  let sequelize;
  let accountModels;
  let accountId = '';

  lab.before(async() => {
    accountModels = require('./account.models');
    const index = await require('../../index.js');
    server = await index.server;
    sequelize = await index.sequelize;
  });


  lab.test('Pretest: GET /accounts Empty', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'GET',
      url: '/accounts'
    });
    const payload = JSON.parse(response.payload)
    expect(payload).to.equal([]);
  });


  lab.test('POST /accounts', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'POST',
      url: '/accounts',
      payload: {
        'username': 'First Last',
      }
    });

    const payload = JSON.parse(response.payload);
    // These are sequelize fields that we don't need to worry about
    delete payload.createdAt;
    delete payload.updatedAt;

    expect(payload.username).to.equal('First Last');
    // save the accountId for later so we can clean up
    accountId = payload.id;

    // We need to combine api schema and id schema for return payload schema
    const payloadSchema = accountModels.api.concat(accountModels.id)
    const validateStatus = Joi.validate(payload, payloadSchema);

    expect(validateStatus.error).to.equal(null);
  });


  lab.test('DELETEs /account/{accountId}', async () => {

    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'DELETE',
      url: '/accounts/' + accountId
    });

    const payload = JSON.parse(response.payload);
    // one row should have been affected
    expect(payload).to.equal(1);
    expect(response.statusCode).to.equal(202);
  });


  lab.test('Posttest: GET /accounts Empty', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'GET',
      url: '/accounts'
    });
    const payload = JSON.parse(response.payload)
    expect(payload).to.equal([]);
  });

});

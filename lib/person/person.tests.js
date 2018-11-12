const { expect } = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Joi = require('joi');

lab.experiment('User', () => {
  let server;
  let sequelize;
  let personModels;
  let personId = '';

  lab.before(async() => {
    personModels = require('./person.models');
    const index = await require('../../index.js');
    server = await index.server;
    sequelize = await index.sequelize;
  });


  lab.test('Pretest: GET /persons Empty', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'GET',
      url: '/persons'
    });
    const payload = JSON.parse(response.payload)
    expect(payload).to.equal([]);
  });


  lab.test('POST /persons', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'POST',
      url: '/persons',
      payload: {
        'username': 'First Last',
      }
    });

    const payload = JSON.parse(response.payload);
    // These are sequelize fields that we don't need to worry about
    delete payload.createdAt;
    delete payload.updatedAt;

    expect(payload.username).to.equal('First Last');
    // save the personId for later so we can clean up
    personId = payload.id;

    // We need to combine api schema and id schema for return payload schema
    const payloadSchema = personModels.api.concat(personModels.id)
    const validateStatus = Joi.validate(payload, payloadSchema);

    expect(validateStatus.error).to.equal(null);
  });


  lab.test('DELETEs /person/{personId}', async () => {

    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'DELETE',
      url: '/persons/' + personId
    });

    const payload = JSON.parse(response.payload);
    // one row should have been affected
    expect(payload).to.equal(1);
    expect(response.statusCode).to.equal(202);
  });


  lab.test('Posttest: GET /persons Empty', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'GET',
      url: '/persons'
    });
    const payload = JSON.parse(response.payload)
    expect(payload).to.equal([]);
  });

});

const { expect } = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Joi = require('joi');

lab.experiment('Property', () => {
  let server;
  let sequelize;
  let propertyModels;
  let propertyId = '';

  lab.before(async() => {
    propertyModels = require('./property.models');
    const index = await require('../../index.js');
    server = await index.server;
    sequelize = await index.sequelize;
  });


  lab.test('Pretest: GET /properties Empty', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'GET',
      url: '/properties'
    });
    const payload = JSON.parse(response.payload)
    expect(payload).to.equal([]);
  });


  lab.test('POST /properties', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'POST',
      url: '/properties',
      payload: {
        'address': '230 North Craig St, Pgh',
      }
    });

    const payload = JSON.parse(response.payload);
    // These are sequelize fields that we don't need to worry about
    delete payload.createdAt;
    delete payload.updatedAt;

    expect(payload.name).to.equal('230 North Craig Street, Pittsburgh, PA 15213');
    // save the personId for later so we can clean up
    propertyId = payload.id;

    // We need to combine api schema and id schema for return payload schema
    // const payloadSchema = personModels.api.concat(personModels.id)
    // const validateStatus = Joi.validate(payload, payloadSchema);
    //
    // expect(validateStatus.error).to.equal(null);
  });


  lab.test('DELETEs /properties/{propertyId}', async () => {

    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'DELETE',
      url: '/properties/' + propertyId
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
      url: '/properties'
    });
    const payload = JSON.parse(response.payload)
    expect(payload).to.equal([]);
  });

});

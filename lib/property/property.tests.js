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
        // it's ok to send numeric fields as number or string
        // bathrooms are allowed 1-9 in .25 increments
        'bathroomsMin': '1',
        'bathroomsMax': 8.75,
        // bedrooms can be 0-10
        'bedroomsMin': 0,
        'bedroomsMax': '10',
      }
    });

    const payload = JSON.parse(response.payload);
    // These are sequelize fields that we don't need to worry about
    delete payload.createdAt;
    delete payload.updatedAt;

    expect(payload.name).to.equal('230 North Craig Street, Pittsburgh, PA 15213');
    // fields stored as decimal are returned as strings
    expect(payload.bathroomsMin).to.equal('1');
    expect(payload.bathroomsMax).to.equal('8.75');
    expect(payload.bedroomsMin).to.equal(0);
    expect(payload.bedroomsMax).to.equal(10);

    // save the accountId for later so we can clean up
    propertyId = payload.id;

    // We need to combine api schema and id schema for return payload schema
    // const payloadSchema = accountModels.api.concat(accountModels.id)
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


  lab.test('Posttest: GET /accounts Empty', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'GET',
      url: '/properties'
    });
    const payload = JSON.parse(response.payload)
    expect(payload).to.equal([]);
  });

});

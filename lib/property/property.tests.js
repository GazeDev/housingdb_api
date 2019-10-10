const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const lab = exports.lab = Lab.script();

lab.experiment('Property', () => {
  let server;
  // let sequelize;
  let propertyId1;
  let propertyId2;
  let accessToken;
  let accountId;

  lab.before(async() => {
    const index = await require('../../index.js');
    server = await index.server;
    // sequelize = await index.sequelize;
    await index.sequelize;

    // Login
    const tokenResponse = await getAccessToken();
    accessToken = tokenResponse.access_token;

    // Post an Account
    const accountResponse = await server.inject({
      method: 'POST',
      url: '/accounts',
      headers: {
        'Authorization': `bearer ${accessToken}`
      },
    });

    accountId = accountResponse.id;
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


  lab.test('POST /properties, no-auth', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'POST',
      url: '/properties',
      payload: {
        'address': '229 North Craig St, Pgh',
      }
    });

    const payload = JSON.parse(response.payload);
    // These are sequelize fields that we don't need to worry about
    delete payload.createdAt;
    delete payload.updatedAt;

    expect(payload.name).to.equal('229 North Craig Street, Pittsburgh, PA 15213');

    // save the propertyId for later so we can clean up
    propertyId1 = payload.id;
  });

  // TODO: POST property with bad AuthorId, get 400:"message": "Must have an Account to create a Property with any field other than address"

  lab.test('POST /properties, auth', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'POST',
      url: '/properties',
      headers: {
        'Authorization': `bearer ${accessToken}`
      },
      payload: {
        'address': '230 North Craig St, Pgh',
        // it's ok to send numeric fields as number or string
        // bathrooms are allowed 1-9 in .25 increments
        'bathroomsMin': '1',
        'bathroomsMax': 8.75,
        // bedrooms can be 0-10
        'bedroomsMin': 0,
        'bedroomsMax': '10',
        'AuthorId': accountId,
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

    // save the propertyId for later so we can clean up
    propertyId2 = payload.id;
  });

  // TODO: POST property by admin with user AuthorId

  // TODO: DELETE from user account, fail

  lab.test('DELETEs /properties/{propertyId}', async () => {

    // wait for the response and the request to finish
    const response1 = await server.inject({
      method: 'DELETE',
      url: '/properties/' + propertyId1
    });

    const payload1 = JSON.parse(response1.payload);
    // one row should have been affected
    expect(payload1).to.equal(1);
    expect(response1.statusCode).to.equal(202);

    // wait for the response and the request to finish
    const response2 = await server.inject({
      method: 'DELETE',
      url: '/properties/' + propertyId2
    });

    const payload2 = JSON.parse(response2.payload);
    // one row should have been affected
    expect(payload2).to.equal(1);
    expect(response2.statusCode).to.equal(202);
  });


  lab.test('Posttest: GET /properties Empty', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'GET',
      url: '/properties'
    });
    const payload = JSON.parse(response.payload)
    expect(payload).to.equal([]);
  });

});

function getAccessToken() {

  return new Promise((resolve, reject) => {
    var qs = require("querystring");
    var http = require("https");

    const endpoint = new URL(process.env.JWT_NETWORK_URI + '/protocol/openid-connect/token');

    const options = {
      "method": "POST",
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded",
      }
    };

    var req = http.request(endpoint, options, function (res) {
      let chunks = "";

      res.on("data", function (chunk) {
        chunks += chunk;
      });

      res.on("end", function () {
        resolve(JSON.parse(chunks));
      });
    });

    req.write(
      qs.stringify({
        grant_type: 'password',
        username: process.env.TEST_USER,
        password: process.env.TEST_PASSWORD,
        client_id: process.env.JWT_CLIENT,
      })
    );
    req.end();

  });
}

const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const lab = exports.lab = Lab.script();

lab.experiment('Account', () => {
  let server;
  let accountId = '';
  let accessToken = '';
  let adminAccessToken = '';

  lab.before(async() => {
    const index = await require('../../index.js');
    server = await index.server;
    await index.sequelize;
  });

  lab.test('Pretest: GET /accounts 401', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'GET',
      url: '/accounts'
    });

    const payload = JSON.parse(response.payload);
    expect(payload).to.include({statusCode: 401, error: 'Unauthorized'});
  });

  lab.test('Test: Get access token', async () => {
    // wait for the response and the request to finish
    const response = await getAccessToken();

    expect(response).to.include({'token_type': 'bearer'});
    expect(response).to.include(['access_token']);
    accessToken = response.access_token;
  });

  lab.test('Pretest: GET /accounts 404', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'GET',
      url: '/accounts',
      headers: {
        'Authorization': `bearer ${accessToken}`
      },
    });
    const payload = JSON.parse(response.payload);
    expect(payload).to.include({statusCode: 404, error: 'Not Found'});
  });


  lab.test('POST /accounts', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'POST',
      url: '/accounts',
      headers: {
        'Authorization': `bearer ${accessToken}`
      },
    });

    const payload = JSON.parse(response.payload);
    expect(payload).to.include(['id', 'externalId']);

  });

  lab.test('Test: Get access token, admin', async () => {
    // wait for the response and the request to finish
    const response = await getAdminAccessToken();

    expect(response).to.include({'token_type': 'bearer'});
    expect(response).to.include(['access_token']);
    adminAccessToken = response.access_token;
  });
  
  lab.test('POST /accounts, admin', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'POST',
      url: '/accounts',
      headers: {
        'Authorization': `bearer ${adminAccessToken}`
      },
    });

    const payload = JSON.parse(response.payload);
    expect(payload).to.include(['id', 'externalId']);

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

function getAdminAccessToken() {

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
        username: process.env.SUPER_ADMIN_USER,
        password: process.env.SUPER_ADMIN_PASSWORD,
        client_id: process.env.JWT_CLIENT,
      })
    );
    req.end();

  });
}

const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const lab = exports.lab = Lab.script();

lab.experiment('Landlord', () => {
  let server;

  let landlord;
  let landlordLib;
  let parseInfo;
  let accessToken;

    lab.before(async() => {
      const index = await require('../../index.js');
      server = await index.server;
      let sequelize = await index.sequelize;

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

      landlord = await require('./landlord.controllers')(sequelize.models);
      landlordLib = landlord.lib;
      parseInfo = landlordLib.parseInfo;
    });

    lab.test('parses landlord string', async () => {
      let text = 'Example Landlord 412.444.5555ext45 landlord@example.com';
      let searches = ['phone', 'email'];
      let remove = true;

      expect(parseInfo(text, searches, remove)).to.equal({
        email: 'landlord@example.com',
        phone: {
          original: '412.444.5555ext45',
          formatted: '(412) 444-5555 ext. 45',
          countryCode: 1,
          nationalNumber: 4124445555,
          extension: '45',
        },
        remainder: 'Example Landlord',
      });
    });

    lab.test('GET /landlords empty', async () => {
      const response = await server.inject('/landlords');
      const payload = JSON.parse(response.payload)
      expect(payload).to.equal([]);
    });

    lab.test('POST /landlords, un-authed', async () => {
      const postPayload = {
        quickInfo: 'Some Landlord',
      };
      const response = await server.inject({
        method: 'POST',
        url: '/landlords',
        payload: postPayload,
      });
      const payload = JSON.parse(response.payload);
      expect(payload).to.include({
        name: postPayload.quickInfo
      });
    });

    lab.test('POST /landlords, authed', async () => {
      const postPayload = {
        name: 'Authd Landlord',
      };
      const response = await server.inject({
        method: 'POST',
        url: '/landlords',
        headers: {
          'Authorization': `bearer ${accessToken}`
        },
        payload: postPayload,
      });
      const payload = JSON.parse(response.payload);
      expect(payload).to.include(postPayload);
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

// submit a landlord with other fields and it works

// submit a landlord with quick_info field and it works

// submit a landlord with a mix of fields and it works

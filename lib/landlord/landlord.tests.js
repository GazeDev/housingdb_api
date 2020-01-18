const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const lab = exports.lab = Lab.script();

lab.experiment('Landlord', () => {
  let server;

  let landlord;
  let landlordLib;
  let parseInfo;
  let accessToken;
  let accountId;
  let adminAccessToken;
  let landlordId1;

    lab.before(async() => {
      const index = await require('../../index.js');
      server = await index.server;
      let sequelize = await index.sequelize;

      // Login
      const tokenResponse = await getAccessToken();
      accessToken = tokenResponse.access_token;

      // Post an Account
      const accountResponse = await server.inject({
        method: 'GET',
        url: '/accounts',
        headers: {
          'Authorization': `bearer ${accessToken}`
        },
      });

      accountId = JSON.parse(accountResponse.payload).id;

      landlord = await require('./landlord.controllers')(sequelize.models);
      landlordLib = landlord.lib;
      parseInfo = landlordLib.parseInfo;

      // Login
      const adminTokenResponse = await getAdminAccessToken();
      adminAccessToken = adminTokenResponse.access_token;
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

    lab.test('GET /accounts/landlords Empty', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/accounts/landlords',
        headers: {
          'Authorization': `bearer ${accessToken}`
        },
      });
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
      landlordId1 = payload.id;
    });

    lab.test('GET /landlords Contains One', async () => {
      const response = await server.inject('/landlords');
      const payload = JSON.parse(response.payload)
      expect(payload.length).to.equal(1);
    });

    lab.test('GET /accounts/landlords Still Empty', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/accounts/landlords',
        headers: {
          'Authorization': `bearer ${accessToken}`
        },
      });
      const payload = JSON.parse(response.payload)
      expect(payload).to.equal([]);
    });

    lab.test('POST/PATCH /landlords, authed', async () => {
      const postPayload = {
        name: 'Authd Landlord',
        AuthorId: accountId,
      };
      const postResponse = await server.inject({
        method: 'POST',
        url: '/landlords',
        headers: {
          'Authorization': `bearer ${accessToken}`
        },
        payload: postPayload,
      });
      const postParse = JSON.parse(postResponse.payload);
      expect(postParse).to.include(postPayload);

      const patchPayload = {
        phone: '412-444-5555'
      };
      const patchResponse = await server.inject({
        method: 'PATCH',
        url: `/landlords/${postParse.id}`,
        headers: {
          'Authorization': `bearer ${accessToken}`
        },
        payload: patchPayload,
      });
      const patchParse = JSON.parse(patchResponse.payload);
      expect(patchParse).to.include({
        phone: "(412) 444-5555"
      });
    });

    lab.test('GET /accounts/landlords Contains One Landlord', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/accounts/landlords',
        headers: {
          'Authorization': `bearer ${accessToken}`
        },
      });
      const payload = JSON.parse(response.payload)
      expect(payload.length).to.equal(1);
    });

    // DELETE from user account, fail
    lab.test('DELETEs /landlords/{landlordId}, user fail', async () => {

      // wait for the response and the request to finish
      const response1 = await server.inject({
        method: 'DELETE',
        url: '/landlords/' + landlordId1,
        headers: {
          'Authorization': `bearer ${accessToken}`
        },
      });

      const payload1 = JSON.parse(response1.payload);
      // one row should have been affected
      expect(response1.statusCode).to.equal(403);
    });

    // DELETE from Admin account, success
    lab.test('DELETEs /landlords/{landlordId}, admin', async () => {

      // wait for the response and the request to finish
      const response1 = await server.inject({
        method: 'DELETE',
        url: '/landlords/' + landlordId1,
        headers: {
          'Authorization': `bearer ${adminAccessToken}`
        },
      });

      const payload1 = JSON.parse(response1.payload);
      // one row should have been affected
      expect(payload1).to.equal(1);
      expect(response1.statusCode).to.equal(202);
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

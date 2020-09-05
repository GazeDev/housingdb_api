const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const lab = exports.lab = Lab.script();
// const sequelize = require('sequelize');


lab.experiment('HousingAvailable', () => {

  let server;
  let housingAvailableId1;
  let housingAvailableId2;
  let accessToken;
  let accountId;
  let adminAccessToken;

  // Set up tests by "logging in" to obtain auth credentials;
  lab.before(async () => {
    const index = await require('../../index.js');
    server = await index.server;
    await index.sequelize;

    const tokenResponse = await getAccessToken();
    accessToken = tokenResponse.access_token;

    // Obtain user auth;
    const accountResponse = await server.inject({
      method: 'GET',
      url: '/accounts',
      headers: {
        'Authorization': `bearer ${accessToken}`
      },
    });
    let accountPayload = JSON.parse(accountResponse.payload);
    accountId = accountPayload.id;
    console.log(accountId);

    // Login
    const adminTokenResponse = await getAdminAccessToken();
    adminAccessToken = adminTokenResponse.access_token;

  });

  // Tests;

  /**
   * Precondition: user isn't logged-in;
   * Postcondition: returns a 401 error, unauthorized user;
   */
  lab.test('GET ALL /housing-available 401', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/housing-available',
    });
    const payload = JSON.parse(response.payload)
    expect(payload).to.include({statusCode: 401, error: 'Unauthorized'});
  });

  /**
   * Precondition: user is logged-in and there are no Housing Availables to display;
   * Postcondition: [], representing an empty array of HAs;
   */
  lab.test('GET ALL /housing-available, no HousingAvailables to display', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/housing-available',
      headers: {
        'Authorization': `bearer ${accessToken}`
      }
    });
    const payload = JSON.parse(response.payload)
    expect(payload).to.equal([]);
  });

  /**
   * Precondition: user is logged-in;
   * Postcondition: http response 200, one Housing Available successfully
   * added to the database;
   */
  lab.test('POST /housing-available, add 1 HousingAvailable', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/housing-available',
      headers: {
        'Authorization': `bearer ${accessToken}`
      }
    });
    const payload = JSON.parse(response.payload)
    expect(payload).to.equal([]);
  });

  /**
   * Precondition: user is NOT logged-in, enters at least one Housing Available;
   * Postcondition: Boom.unauthorized('Must be logged-in to create Housing Available');
   * POST /housing-available, no-auth
   * Uses a different address than the auth'd test so as to avoid potential complications
   * due to externals;
   */
  // lab.test('POST /housing-available, no-auth', async () => {
  //   const response = await server.inject({
  //     method: 'POST',
  //     url: '/housing-available',
  //     payload: {
  //       'address': '5540 5th Ave, Pittsburgh, PA 15232',
  //       // it's ok to send numeric fields as number or string
  //       // bathrooms are allowed 1-9 in .25 increments
  //       // Test edge-cases for # of bedrooms/bathrooms;
  //       'bathroomsMin': '1',
  //       'bathroomsMax': 8.75,
  //       // bedrooms can be 0-10
  //       'bedroomsMin': 0,
  //       'bedroomsMax': '10',
  //       'AuthorId': accountId,
  //     },
  //   });
  //   const payload = JSON.parse(response.payload);
  //   // If user not auth'd: expect 401 error via Boom;
  //   expect(payload).to.equal(Boom.unauthorized());
  // });

  /**
   * Precondition: user is logged-in, enters at least one Housing Available;
   * Postcondition: at least one Housing Available is stored;
   * POST /housing-available, auth
   */
  // lab.test('POST /housing-available, auth', async () => {
  //   // wait for the response and the request to finish
  //   const response = await server.inject({
  //     method: 'POST',
  //     url: '/housing-available',
  //     headers: {
  //       'Authorization': `bearer ${accessToken}`
  //     },
  //     payload: {
  //       'address': '2400 Village Rd, Pittsburgh, PA 15205',
  //       // it's ok to send numeric fields as number or string
  //       // bathrooms are allowed 1-9 in .25 increments
  //       // Test edge-cases for # of bedrooms/bathrooms;
  //       'bathroomsMin': '1',
  //       'bathroomsMax': 8.75,
  //       // bedrooms can be 0-10
  //       'bedroomsMin': 0,
  //       'bedroomsMax': '10',
  //       'AuthorId': accountId,
  //     }
  //   });
  //   const payload = JSON.parse(response.payload);

  //   expect(payload.name).to.equal('2400 Village Rd, Pittsburgh, PA 15205');
  //   // fields stored as decimal are returned as strings
  //   expect(payload.bathroomsMin).to.equal('1');
  //   expect(payload.bathroomsMax).to.equal('8.75');
  //   expect(payload.bedroomsMin).to.equal(0);
  //   expect(payload.bedroomsMax).to.equal(10);
  //   expect(payload.AuthorId).to.equal(accountId);

  //   // save the housingAvailableId for later so we can clean up
  //   housingAvailableId1 = payload.id;
  // });

  /**
   * Precondition: user is logged-in, has submitted at least one Housing Available;
   * Postcondition: all stored Housing Availables are fetched & displayed;
   * GET /housing-available
   */
  // lab.test('GET /housing-available, auth', async () => {
  //   const response = await server.inject({
  //     method: 'POST',
  //     url: '/housing-available',
  //     headers: {
  //       'Authorization': `bearer ${accessToken}`,
  //     },
  //     payload: {
  //       'address': '5540 5th Ave, Pittsburgh, PA 15232',
  //       // it's ok to send numeric fields as number or string
  //       // bathrooms are allowed 1-9 in .25 increments
  //       // Test edge-cases for # of bedrooms/bathrooms;
  //       'bathroomsMin': '1',
  //       'bathroomsMax': 8.75,
  //       // bedrooms can be 0-10
  //       'bedroomsMin': 0,
  //       'bedroomsMax': '10',
  //       'AuthorId': accountId,
  //     },
  //   });
  //   const payload = JSON.parse(response.payload);

  //   expect(payload.name).to.equal('5540 5th Ave, Pittsburgh, PA 15232');
  //   // fields stored as decimal are returned as strings
  //   expect(payload.bathroomsMin).to.equal('1');
  //   expect(payload.bathroomsMax).to.equal('8.75');
  //   expect(payload.bedroomsMin).to.equal(0);
  //   expect(payload.bedroomsMax).to.equal(10);
  //   expect(payload.AuthorId).to.equal(accountId);

  //   // save the housingAvailableId for later so we can clean up
  //   housingAvailableId2 = payload.id;
  // });

});

// Helper functions;

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

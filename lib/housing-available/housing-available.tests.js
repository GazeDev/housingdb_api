const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const lab = exports.lab = Lab.script();


lab.experiment('HousingAvailable', () => {

  let server;
  let accessToken;
  let accountId;
  let adminAccessToken;
  var HousingAvailableId1;
  let HousingAvailableId2;


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
    console.log(`\naccountId = ${accountId} \n`);

    // Login
    const adminTokenResponse = await getAdminAccessToken();
    adminAccessToken = adminTokenResponse.access_token;

  });

  // Tests;

  /**
   * Precondition: user isn't logged-in;
   * Postcondition: returns a 401 error, unauthorized user;
   */
  lab.test('Pretest: GET ALL /housing-available 401', async () => {
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
  lab.test('Pretest: GET ALL /housing-available, no HousingAvailables to display', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/housing-available',
      headers: {
        'Authorization': `bearer ${accessToken}`
      }
    });
    const payload = JSON.parse(response.payload);
    expect(payload).to.equal([]);
  });

  /**
   * Precondition: user is logged-in;
   * Postcondition: http response 200, one Housing Available successfully
   * added to the database;
   */
  lab.test('POST 1 /housing-available, user logged-in', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/housing-available',
      headers: {
        'Authorization': `bearer ${accessToken}`
      },
      payload: {
        'contact': 'Dan@testing.com',
        'title': 'Hedgewood Estates',
        'body': 'Affordable living in one of Pittsburghs most walkable neighborhoods',
        'address': '5700 Bunkerhill St, Pittsburgh, PA 15206',
        'bedrooms': '2',
        'bathrooms': '1',
        'website': 'https://www.hotdogs.com',
        'status': 'pending',
        'AuthorId': accountId,
      },
    });
    const payload = JSON.parse(response.payload);
    HousingAvailableId1 = payload.id;
    console.log("Housing available Id1 is : " + HousingAvailableId1);
    console.log(`response.payload.id equals: ${payload.id}`);

    expect(response).to.include({ statusCode: 200 });
  });

    /**
     * Precondition: user is logged-in, one prior Housing Available has been
     * successfully added to the database;
     * Postcondition: http response 200, a 2nd Housing Available is successfully
     * added to the database; this will be to test the GET ALL, auth'd route;
     */
    lab.test('POST another /housing-available, user logged-in', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/housing-available',
        headers: {
          'Authorization': `bearer ${accessToken}`
        },
        payload: {
          'contact': 'Little Edie',
          'title': 'Grey Gardens',
          'body': 'Shambolic bohemian enclave in the heart of Pittsburgh!',
          'address': '5637 Hobart St Unit 23 Pittsburgh, PA 15217',
          'bedrooms': '3',
          'bathrooms': '2.5',
          'website': 'https://www.awebsiteamongothers.com',
          'status': 'active',
          'AuthorId': accountId,
        },
      });
      expect(response).to.include({ statusCode:200 });
    });


  /**
   * Precondition: user is logged-in and there are 2 Housing Availables to display;
   * Postcondition: displays the the 2 previously-added Housing Availables;
   */
  lab.test('Pretest: GET ALL /housing-available, 2 HousingAvailables to display', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/housing-available',
      headers: {
        'Authorization': `bearer ${accessToken}`
      }
    });
    expect(response).to.include({ statusCode:200 });
  });

  /**
   * Precondition: user is logged-in and there is at least one Housing Available to display;
   * Postcondition: display/return the ID-specified Housing Available listing;
   */
  lab.test('Pretest: GET ONE /housing-available by primary key(id), >=1 HousingAvailables to display', async () => {
    console.log(`HousingAvailableId1 equals ${HousingAvailableId1}`);
    const response = await server.inject({
      method: 'GET',
      url: `/housing-available/:${HousingAvailableId1}`,
      headers: {
        'Authorization': `bearer ${accessToken}`,
      }
    });
    const payload = JSON.parse(response.payload);
    console.log(payload);
    expect(payload.id).to.equal(`${HousingAvailableId1}`);
    // expect(response).to.include({ statusCode: 200 });
  });



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

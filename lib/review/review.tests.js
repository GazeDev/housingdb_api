const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const lab = exports.lab = Lab.script();

lab.experiment('Review', () => {
  let server;
  let landlordId = '';
  let propertyId = '';
  let accountId = '';
  let accessToken = '';
  let landlordReview;
  let propertyReview;

  lab.before(async() => {
    const index = await require('../../index.js');
    server = await index.server;
    await index.sequelize;

    // Create a Landlord
    landlordId = await createLandlord(server);

    // Create a Property
    propertyId = await createProperty(server);

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
  });

  // Create a Review on that Landlord
  lab.test('POST /landlords/{landlordId}/reviews', async () => {
    // wait for the response and the request to finish
    const postPayload = {
      subject: 'Testing Landlord Review',
      body: 'This is a testing landlord review that has a body.',
      rating: 5,
    };
    const response = await server.inject({
      method: 'POST',
      url: `/landlords/${landlordId}/reviews`,
      payload: postPayload,
      headers: {
        'Authorization': `bearer ${accessToken}`
      },
    });

    const payload = JSON.parse(response.payload);
    expect(payload).to.include(postPayload);
    landlordReview = payload;
  });

  // Get reviews on that Landlord
  lab.test('GET /landlords/{landlordId}/reviews', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'GET',
      url: `/landlords/${landlordId}/reviews`
    });

    const payload = JSON.parse(response.payload);
    expect(payload).to.be.an.array();
    expect(payload).to.not.include(['AuthorId']);

    // This expect requires an exact object match when evaluating an array of objects
    // It should be the POST response without the AuthorId
    delete landlordReview.AuthorId;
    expect(payload).to.include(landlordReview);
  });

  // Create a Review on that Property
  lab.test('POST /properties/{propertyId}/reviews', async () => {
    // wait for the response and the request to finish
    const postPayload = {
      subject: 'Testing Property Review',
      body: 'This is a testing property review that has a body.',
      rating: 1,
    };
    const response = await server.inject({
      method: 'POST',
      url: `/properties/${propertyId}/reviews`,
      payload: postPayload,
      headers: {
        'Authorization': `bearer ${accessToken}`
      },
    });

    const payload = JSON.parse(response.payload);
    expect(payload).to.include(postPayload);
    propertyReview = payload;
  });

  // Get reviews on that Property
  lab.test('GET /properties/{propertyId}/reviews', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'GET',
      url: `/properties/${propertyId}/reviews`
    });

    const payload = JSON.parse(response.payload);
    expect(payload).to.be.an.array();
    expect(payload).to.not.include(['AuthorId']);

    // This expect requires an exact object match when evaluating an array of objects
    // It should be the POST response without the AuthorId
    delete propertyReview.AuthorId;
    expect(payload).to.include(propertyReview);
  });

  // Get reviews (for logged in user)
  lab.test('GET /reviews', async () => {
    // wait for the response and the request to finish
    const response = await server.inject({
      method: 'GET',
      url: `/reviews`,
      headers: {
        'Authorization': `bearer ${accessToken}`
      },
    });

    const payload = JSON.parse(response.payload);
    expect(payload).to.be.an.array();
    expect(payload.length).to.be.at.least(2);

    // This expect requires an exact object match when evaluating an array of objects
    // It should be the POST response without the AuthorId
    delete propertyReview.AuthorId;
    expect(payload).to.include([propertyReview, landlordReview]);
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


async function createLandlord(server) {
  const postPayload = {
    quickInfo: 'Reviewable Landlord',
  };
  const response = await server.inject({
    method: 'POST',
    url: '/landlords',
    payload: postPayload,
  });
  const payload = JSON.parse(response.payload);
  return payload.id;
}

async function createProperty(server) {
  const response = await server.inject({
    method: 'POST',
    url: '/properties',
    payload: {
      'address': '231 North Craig St, Pgh',
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
  return payload.id;
}

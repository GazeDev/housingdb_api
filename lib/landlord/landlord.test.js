// const landlord = require('./landlord.controllers');
// const landlordLib = landlord.lib;
// const parseInfo = landlordLib.parseInfo;
// const server = require('../server.js');
// const app = server.server;
//
// describe("Landlord Test Suite", function () {
//   beforeAll(async () => {
//     await server.db;
//     await server.server;
//     return server;
//   });
//
//   test('parses landlord string', () => {
//     jest.setTimeout(10000);
//     let text = 'Example Landlord 412.444.5555ext45 landlord@example.com';
//     let searches = ['phone', 'email'];
//     let remove = true;
//     let result = {
//       email: 'landlord@example.com',
//       phone: {
//         original: '412.444.5555ext45',
//         formatted: '(412) 444-5555 ext. 45',
//         countryCode: '1',
//         nationalNumber: '4124445555',
//         extension: '45',
//       },
//       remainder: 'Example Landlord',
//     };
//     expect(parseInfo(text, searches, remove)).toEqual(result);
//   });
//
//   test('should get /health', (done) => {
//     return request(app)
//       .get('/health')
//       .expect(200, 'Healthy!')
//
//   });
//
//
// });

const { expect } = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

lab.experiment('math', () => {
  let server;
  // let sequelize;
  let landlord;
  let landlordLib;
  let parseInfo;

    lab.before(async() => {
      // TODO: refactor so all the models are declared before we call upon them
      const index = await require('../server.js');
      server = await index.server;
      landlord = await require('./landlord.controllers');
      landlordLib = landlord.lib;
      parseInfo = landlordLib.parseInfo;
      // sequelize = await index.sequelize;
    });

    lab.test('simple addition', () => {
      expect(1 + 1).to.equal(2);
    });

    lab.test('parses landlord string', async () => {
      let text = 'Example Landlord 412.444.5555ext45 landlord@example.com';
      let searches = ['phone', 'email'];
      let remove = true;
      let result = {
        email: 'landlord@example.com',
        phone: {
          original: '412.444.5555ext45',
          formatted: '(412) 444-5555 ext. 45',
          countryCode: '1',
          nationalNumber: '4124445555',
          extension: '45',
        },
        remainder: 'Example Landlord',
      };
      expect(parseInfo(text, searches, remove)).to.equal(result);
    });

    lab.test('GETs /', async () => {
      const response = await server.inject('/');
      expect(response.payload).to.equal('Hello, world!');
    });

    lab.test('GET /landlords', async () => {
      const response = await server.inject('/landlords');
      const payload = JSON.parse(response.payload)
      expect(payload).to.equal([]);
    });

    lab.test('POST /landlords', async () => {
      const postPayload = {
        name: 'Some Landlord',
      };
      const response = await server.inject({
        method: 'POST',
        url: '/landlords',
        payload: postPayload,
      });
      const payload = JSON.parse(response.payload);
      expect(payload).to.equal(postPayload);
    });

});

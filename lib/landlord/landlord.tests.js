const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const lab = exports.lab = Lab.script();

lab.experiment('Landlord', () => {
  let server;

  let landlord;
  let landlordLib;
  let parseInfo;

    lab.before(async() => {
      const index = await require('../../index.js');
      server = await index.server;
      let sequelize = await index.sequelize;

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
      expect(payload).to.include(postPayload);
    });

});

// submit a landlord with other fields and it works

// submit a landlord with quick_info field and it works

// submit a landlord with a mix of fields and it works

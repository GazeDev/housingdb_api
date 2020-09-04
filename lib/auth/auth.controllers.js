module.exports = (models) => {
  const Boom = require('@hapi/boom');

  return {

    getAuthLogin: function(request, h) {
      let baseUrl = `${process.env.JWT_ISSUER}/protocol/openid-connect/auth`
      let selfHost = process.env.SELF_HOST;
      let http = 'https';
      if (selfHost.indexOf('localhost') === 0) {
        http = 'http';
      }
      if (selfHost.indexOf('http') !== 0) {
        selfHost = http + '://' + selfHost;
      }
      let redirectUri = selfHost + '/auth/token'
      var url = baseUrl
          + '?client_id=' + encodeURIComponent('housingdb')
          + '&redirect_uri=' + encodeURIComponent(redirectUri)
          + '&state=' + encodeURIComponent(createUUID())
          + '&response_mode=' + encodeURIComponent('query') // or 'fragment'
          + '&response_type=' + encodeURIComponent('code')
          + '&scope=' + encodeURIComponent('openid');
      return url;
    },
    getAuthToken: async function(request, h) {
      const params = request.query

      let token = await redeemCodeForToken(params.code);
      if (token.access_token) {
        return accessTokenHTML(token.access_token);
      } else {
        return token;
      }
    },
    getAuthRequired: async function(request, h) {
      return {
        loggedIn: true,
        superAdmin: (process.env.SUPER_ADMIN === request.auth.credentials.subjectId),
      };
    },
  };

  function createUUID() {
      var s = [];
      var hexDigits = '0123456789abcdef';
      for (var i = 0; i < 36; i++) {
          s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
      }
      s[14] = '4';
      s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
      s[8] = s[13] = s[18] = s[23] = '-';
      var uuid = s.join('');
      return uuid;
  }

  /*
   * Takes a code and generates a token
   */
  function redeemCodeForToken(code) {
    return new Promise((resolve, reject) => {

      const url = require('url');
      const querystring = require('querystring');
      let http;

      let baseUrl = process.env.JWT_NETWORK_URI;
      const api = new URL(`${baseUrl}/protocol/openid-connect/token`);

      if (api.toString().indexOf('https') === 0) {
        http = require('https');
      } else {
        http = require('http');
      }

      let selfHost = process.env.SELF_HOST;
      let protocol = 'https';
      if (selfHost.indexOf('localhost') === 0) {
        protocol = 'http';
      }
      if (selfHost.indexOf('http') !== 0) {
        selfHost = protocol + '://' + selfHost;
      }
      let redirectUri = selfHost + '/auth/token'

      var postData = querystring.stringify({
        'code': code,
        'grant_type': 'authorization_code',
        'client_id': process.env.JWT_CLIENT,
        'redirect_uri': redirectUri,
      });

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(api, options, (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(JSON.parse(data));
        });
      });

      req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
        reject(e.message);
      });

      // Write data to request body
      req.write(postData);
      req.end();

    });

  }

  function accessTokenHTML(access_token) {
    return `
    <!DOCTYPE html>
    <head>
    <title>Access Token</title>
    </head>
    <body style="overflow: hidden; word-wrap: break-word;">
      ${access_token}
    </body>
    `;
  }

};

'use strict';

const Hapi = require('hapi');
const Sequelize = require('sequelize');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');

const jwt = require('hapi-auth-jwt2');
const jwksRsa = require('jwks-rsa');


module.exports = (async() => {

  const envVars = [
    'CORS_ORIGIN',
    'SELF_HOST',
    'JWT_AUDIENCE',
    'JWT_ISSUER',
    'JWT_NETWORK_URI',
    'JWT_CLIENT',
    'ADDRESS_API',
    'ADDRESS_API_KEY'
  ];

  for (let envVar of envVars) {
    if (!process.env[envVar]) {
      throw `Error: Make sure you have ${envVar} in your environment variables.`;
    }
  }

  const server = new Hapi.Server({
    port: process.env.PORT || 8081,
    routes: {cors: {
      additionalHeaders: ['access-control-allow-origin'],
      origin: [process.env.CORS_ORIGIN],
    }}
  });

  // standardize variables used for db connection
  let db_name, db_user, db_password, db_host, db_port, db_type;

  // db connection may be set as a DATABASE_URL string we have to parse
  if (process.env.DATABASE_URL) {
    let url = new URL(process.env.DATABASE_URL);
    db_name = url.pathname.replace(/^\//, "");
    db_user = url.username;
    db_password = url.password;
    db_host = url.hostname;
    db_port = url.port;
    db_type = url.protocol.replace(/\:$/, "")
  } else {
    db_name = process.env.DB_NAME;
    db_user = process.env.DB_USER;
    db_password = process.env.DB_PASSWORD;
    db_host = process.env.DB_HOST;
    db_port = '';
    db_type = process.env.DB_TYPE;
  }

  let sequelize;
  try {
    sequelize = new Sequelize(db_name, db_user, db_password, {
      host: db_host,
      dialect: db_type,
      port: db_port,
      pool: {
        log: true,
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      logging: false,
    });
  } catch (err) {
    console.log('Sequelize init error:');
    console.log(err);
  }


  const modules = require('./lib/modules');

  const models = {};

  const routes = [];

  // define the models of all of our modules
  for (let mod of modules) {
    let modelsFile;
    try {
      modelsFile = require(`./lib/${mod}/${mod}.models.js`);
      if (modelsFile.db) {
        let model = modelsFile.db(sequelize, Sequelize);
        models[model.name] = model;
      }
    } catch(err) {
      console.log(err);
      console.log(`module ${mod} did not have a models file`);
    }
  }
  // now that all the models are loaded, run associations
  Object.keys(models).forEach(function(modelName) {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });

  // NOTE: This will wipe/forcibly restructure a database. ONLY USE FOR DEV.
  try {
    await sequelize.sync({force: true});
  } catch (e) {
    console.log('sync error');
    console.log(e);
  }

  const validateUser = async (decoded, request) => {
    // This is a simple check that the `sub` claim
    // exists in the access token.

    if (decoded && decoded.sub) {
      // Email may not be verified, we should decide if that's OK and/or if we
      // validate that at this level or the route level.
      return {
        isValid: true,
        credentials: {
          scope: decoded.scope.split(' '),
          resourceAccess: decoded.resource_access,
          subjectId: decoded.sub,
          email: decoded.email,
          emailVerified: decoded.email_verified,
          name: decoded.name,
          preferredUsername: decoded.preferred_username,
          givenName: decoded.given_name,
          familyName: decoded.family_name,
        },
      };
    }
    return { isValid: false };
  };

  await server.register(jwt);

  server.auth.strategy('jwt', 'jwt', {
    complete: true,
    // verify the access token against the remote JWKS
    key: jwksRsa.hapiJwt2KeyAsync({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 60,
      jwksUri: `${process.env.JWT_NETWORK_URI}/protocol/openid-connect/certs`,
    }),
    verifyOptions: {
      audience: process.env.JWT_AUDIENCE,
      issuer: process.env.JWT_ISSUER,
      algorithms: ['RS256']
    },
    validate: validateUser
  });

  server.auth.default({
    strategy: 'jwt',
    mode: 'optional'
  });

  /*
    NOTE:
    If a user has Authorization token, it will be passed and validated. If it is
    invalid the request will fail. Any handler can check if the user is authenticated
    by checking `request.auth.isAuthenticated`. Any route can require authentication
    by setting `config.auth: 'jwt'`, which will require the 'jwt' auth strategy
    from above. If a user is authenticated then the credentials from the strategy
    will be available in `request.auth.credentials`.
   */

  // Build the routes of all our modules, injecting the models into each
  for (let mod of modules) {
    let routesFile;
    try {
      routesFile = require(`./lib/${mod}/${mod}.routes.js`);
      if(routesFile.routes) {
        await server.route(routesFile.routes(models));
      }
    } catch(err) {
      console.log(err);
      console.log(`module ${mod} did not have a routes file or hapi failed to register them`);
    }
  }

  server.route({
    method: 'GET',
    path: '/',
    handler: function (request, h) {
      return h
        .response({status: 'up'});
    }
  });

  const swaggerOptions = {
    host: process.env.SELF_HOST,
    info: {
      title: 'API Documentation',
      version: "1.0",
    },
    grouping: 'tags',
    securityDefinitions: {
      'Bearer': {
        'type': 'apiKey',
        'name': 'Authorization',
        'in': 'header'
      },
      'gaze_auth': {
        'type':	'oauth2',
        'authorizationUrl':	`${process.env.JWT_ISSUER}/protocol/openid-connect/auth`,
        'tokenUrl': `${process.env.JWT_ISSUER}/protocol/openid-connect/token`,
        'flow':	'accessCode'
      },
    },
    security: [{ 'Bearer': []}],
    // jsonEditor: true,
  };

  try {
    await server.register([Inert, Vision, {
      'plugin': HapiSwagger,
      'options': swaggerOptions
    }]);
  } catch (err) {
    console.log(err);
  }


  try {
    server.start();
  } catch(err) {
    console.log(err);
  }

  return {
    server: server,
    sequelize: sequelize
  };
})();

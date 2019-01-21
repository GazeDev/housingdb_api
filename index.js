'use strict';

const Hapi = require('hapi');
const Sequelize = require('sequelize');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');

module.exports = (async() => {
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
      // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
      operatorsAliases: false
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
    // await sequelize.sync({force: true});
  } catch (e) {
    console.log('sync error');
    console.log(e);
  }


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
    grouping: 'tags'
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
    console.log('Server running at:', server.info.uri);
  } catch(err) {
    console.log(err);
  }

  return {
    server: server,
    sequelize: sequelize
  };
})();

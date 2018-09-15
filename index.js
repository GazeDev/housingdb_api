'use strict';

const Hapi = require('hapi');
const Sequelize = require('sequelize');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');

module.exports = (async() => {
  const server = new Hapi.Server({
    port: 8081
  });

  const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_TYPE,
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
  await sequelize.sync({force: true});

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
        .response('Hello, world!');
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

  await server.register([Inert, Vision, {
    'plugin': HapiSwagger,
    'options': swaggerOptions
  }]);

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

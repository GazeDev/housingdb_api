const joi = require('joi');
module.exports = (models) => {
  const Boom = require('boom');
  const Sequelize = require('sequelize');
  const Op = Sequelize.Op;
  const housingAvailableModels = require('./housing-available.models');
  const Log = require('../log/log.controllers')(models).lib;
  const accountLib = require('../account/account.controllers')(models).lib;
  const propertyLib = require('../property/property.controllers')(models).lib;
  return {};
};
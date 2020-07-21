const joi = require('joi');
module.exports = (models) => {
  const Boom = require('boom');
  const Sequelize = require('sequelize');
  const Op = Sequelize.Op;
  const housingAvailableModels = require('./housing-available.models');
  const Log = require('../log/log.controllers')(models).lib;
  return {};
};
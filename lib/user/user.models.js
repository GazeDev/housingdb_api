// 'use strict';

const Joi = require('joi');

module.exports = {
  db: (sequelize, Sequelize) => {
    const User = sequelize.define('User', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      username: Sequelize.STRING
    });

    return User;
  },
  id: Joi.object().keys({
      id: Joi.string().guid().required(),
  }),
  api: Joi.object().keys({
      username: Joi.string().required(),
  })
};

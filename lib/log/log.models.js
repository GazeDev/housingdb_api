const Joi = require('joi');
// const PostalAddressDB = require('../postal-address').models.PostalAddressDB;

module.exports = {
  db: (sequelize, Sequelize) => {
    const Log = sequelize.define('Log', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      type: Sequelize.STRING,
      severity: Sequelize.ENUM({
        values: [
          'Emergency',
          'Alert',
          'Critical',
          'Error',
          'Warning',
          'Notice',
          'Info', // shortening of Informational
          'Debug',
        ]
      }),
      data: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
    });

    return Log;
  },
  id: Joi.object().keys({
    id: Joi.string().guid().required(),
  }),
};

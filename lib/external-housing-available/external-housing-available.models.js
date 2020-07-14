const Joi = require('joi');

module.exports = {
  db: (sequelize, Sequelize) => {
    const ExternalHousing = sequelize.define('ExternalHousing', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      author: Sequelize.STRING,
      title: Sequelize.STRING,
      address: Sequelize.STRING,
      location: Sequelize.STRING,
      numberOfBeds: Sequelize.INTEGER,
      numberOfBathrooms: Sequelize.DECIMAL,
      contact: Sequelize.STRING,
      body: Sequelize.TEXT,
      status: Sequelize.ENUM({
        values: [
          'available',
          'pending',
          'unavailable'
        ]
      }),
      url: Sequelize.TEXT,
      details: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
    });
    return ExternalHousing;
  },
  id: Joi.object().keys({
    id: Joi.string().guid().required(),
  }),
};
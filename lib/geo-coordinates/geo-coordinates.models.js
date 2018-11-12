const Joi = require('joi');

module.exports = {
  db: (sequelize, Sequelize) => {
    const GeoCoordinates = sequelize.define('GeoCoordinates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      latitude: Sequelize.STRING,
      longitude: Sequelize.STRING,
    });

    return GeoCoordinates;
  },
  id: Joi.object().keys({
    id: Joi.string().guid().required(),
  }),
  api: Joi.object().keys({
    latitude: Joi.string(),
    longitude: Joi.string(),
  })
};

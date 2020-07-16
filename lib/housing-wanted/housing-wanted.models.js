const Joi = require('joi');
const propertyModels = require('../property/property.models.js');

module.exports = {
  db: (sequelize, Sequelize) => {
    const HousingWanted = sequelize.define('HousingWanted', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      beds: Sequelize.INTEGER,
      baths: Sequelize.INTEGER,
      contact: Sequelize.STRING,
      body: Sequelize.TEXT,
      status: Sequelize.STRING,
      details: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
    });

    return HousingWanted;
  },

};

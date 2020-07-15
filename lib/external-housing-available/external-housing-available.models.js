const Joi = require('joi');

module.exports = {
  db: (sequelize, Sequelize) => {
    const ExternalHousingAvailable = sequelize.define('ExternalHousingAvailable', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      author: Sequelize.STRING,
      title: Sequelize.STRING,
      address: Sequelize.STRING,
      location: Sequelize.STRING,
      beds: Sequelize.INTEGER,
      baths: Sequelize.DECIMAL,
      contact: Sequelize.STRING,
      body: Sequelize.TEXT,
      status: Sequelize.STRING,
      url: Sequelize.TEXT,
      details: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
    });
    return ExternalHousingAvailable;
  },
};



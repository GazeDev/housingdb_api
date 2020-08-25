const Joi = require('joi');
const propertyModels = require('../property/property.models.js');
const landlordModels = require('../landlord/landlord.models.js');

// Define the schema representing a single rental listing, a.k.a. a HousingAvailable object;
module.exports = {
  db: (sequelize, Sequelize) => {
    const HousingAvailable = sequelize.define("HousingAvailable", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      // 'contact' is contact info;
      contact: Sequelize.STRING,
      // 'title' is a headline or tagline the landlord can put to catch
      // the attention of potential renters, e.g. "Great 3-bedroom townhouse in Lower Queen Anne!";
      title: Sequelize.STRING,
      // 'body' will be used by the author of the post
      // to describe the property in their own words;
      body: Sequelize.TEXT,
      bedrooms: Sequelize.INTEGER,
      bathrooms: Sequelize.DECIMAL,
      // status: 'available', 'unavailable', 'pending', 'claimed', 'active':
      status: Sequelize.STRING,
      details: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      website: Sequelize.TEXT,
      address: Sequelize.STRING,
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
    });

    HousingAvailable.associate = (models) => {
      models.HousingAvailable.belongsTo(models.Account);
      models.HousingAvailable.belongsTo(models.Location);
      models.HousingAvailable.belongsTo(models.Landlord);
      models.HousingAvailable.belongsTo(models.Property);
    };
    return HousingAvailable;
  },

  id: Joi.object().keys({
    id: Joi.string().guid()
  }),
  // Define api;
  api: Joi.object().keys({
    contact: Joi.string().required(),
    title: Joi.string().required(),
    body: Joi.string().required(),
    address: Joi.string(),
    bedrooms: Joi.number().integer().min(0).max(9),
    bathrooms: Joi.number().precision(2).min(0).max(9),
    website: Joi.string().uri({scheme: ['https','http']}),
    status: Joi.string().valid('pending', 'active', 'inactive'),
    // details: {},
    AuthorId: Joi.string().guid(),
  }),
  // Define Joi schema validation;





};

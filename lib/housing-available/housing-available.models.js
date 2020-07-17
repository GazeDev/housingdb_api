const Joi = require('joi');
// We will associate data about the property itself w/the data contained herein pertaining to said rental;
const propertyModels = require('../property/property.models.js');
// We will associate landlord data w/the rental listing author, which we can assume will be a landlord;
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
      // 'contact' will be the name of the person to contact,
      // usually the Landlord posting the listing, although said
      // Landlord should be able to enter their name manually here,
      // in case they go by a nickname, or 
      // have someone else managing their property; the potential renter will
      // still be able to see which user (Landlord) posted the listing;
      contact: Sequelize.STRING,
      // 'title' is a headline or tagline the landlord can put to catch 
      // the attention of potential renters, e.g. "Great 3-bedroom townhouse in Lower Queen Anne!";
      title: Sequelize.STRING,
      // 'body' will be used by the author of the post
      // to describe the property in their own words;
      body: Sequelize.TEXT,
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
};

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
      author: Sequelize.STRING,
      title: Sequelize.STRING,
      location: Sequelize.STRING,
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

    // HousingWanted.associate = function (models) {
    //   models.Landlord.hasMany(models.Property, {as: 'Properties'});
    //   models.Landlord.belongsTo(models.Account, {as: 'Author'});
    // };

    return HousingWanted;
  },

//   id: Joi.object().keys({
//     id: Joi.string().guid()
//   }),
//   api: Joi.object().keys({
//     quickInfo: Joi.string(),
//     author: Joi.string(), // TODO: should be required if no quick info
//     body: Joi.string(),
//     contact: Joi.string(),
//     AuthorId: Joi.string().guid(),
//   }),

};

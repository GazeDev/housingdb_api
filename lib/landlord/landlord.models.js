const Joi = require('joi');

module.exports = {
  db: (sequelize, Sequelize) => {
    const Landlord = sequelize.define('Landlord', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: Sequelize.STRING,
      body: Sequelize.TEXT,
      phone: Sequelize.STRING,
      phoneCountry: Sequelize.STRING,
      phoneNational: Sequelize.STRING,
      phoneExtension: Sequelize.STRING,
      website: Sequelize.STRING,
      email: Sequelize.STRING,
    });

    Landlord.associate = function (models) {
      models.Landlord.hasMany(models.Property, {as: 'Properties'});
      models.Landlord.belongsTo(models.Person, {as: 'Owner'});
    };

    return Landlord;
  },
  id: Joi.object().keys({
    id: Joi.string().guid()
  }),
  api: Joi.object().keys({
    // quick_info: Joi.string(),
    name: Joi.string().required(),
    body: Joi.string(),
    phone: Joi.string(),
    // phoneCountry: Joi.string(),
    // phoneNational: Joi.string(),
    // phoneExtension: Joi.string(),
    website: Joi.string().uri({scheme: '/https?/'}),
    email: Joi.string().email(),
  }),
  object: Joi.object().keys({
    name: Joi.string().required(),
    body: Joi.string(),
    phone: Joi.string(),
    phoneCountry: Joi.string(),
    phoneNational: Joi.string(),
    phoneExtension: Joi.string(),
    // website: Joi.string().uri({scheme: '/https?/'}),
    email: Joi.string().email(),
  }),
  landlordPropertyApi: Joi.object().keys({
    name: Joi.string(),
    address: Joi.string().required(),
    landlord: Joi.string(),
    // landlordId: Joi.string().guid(),
    body: Joi.string(),
  })
};

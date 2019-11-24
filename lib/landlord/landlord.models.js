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
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
    });

    Landlord.associate = function (models) {
      models.Landlord.hasMany(models.Property, {as: 'Properties'});
      models.Landlord.belongsTo(models.Account, {as: 'Author'});
    };

    return Landlord;
  },
  id: Joi.object().keys({
    id: Joi.string().guid()
  }),
  api: Joi.object().keys({
    quickInfo: Joi.string(),
    name: Joi.string(), // TODO: should be required if no quick info
    body: Joi.string(),
    phone: Joi.string(),
    // phoneCountry: Joi.string(),
    // phoneNational: Joi.string(),
    // phoneExtension: Joi.string(),
    website: Joi.string().uri({scheme: ['https','http']}),
    email: Joi.string().email(),
    AuthorId: Joi.string().guid(),
  }),
  apiPatch: Joi.object().keys({
    AuthorId: Joi.string().guid(),
    name: Joi.string(),
    phone: Joi.string().allow(""),
    email: Joi.string().email().allow(""),
    website: Joi.string().uri({scheme: ['https','http']}).allow(""),
    body: Joi.string().allow(""),
  }),
  object: Joi.object().keys({
    name: Joi.string().required(),
    body: Joi.string(),
    phone: Joi.string(),
    phoneCountry: Joi.number(),
    phoneNational: Joi.number(),
    phoneExtension: Joi.number(),
    website: Joi.string().uri({scheme: ['https','http']}),
    email: Joi.string().email(),
    AuthorId: Joi.string().guid(),
  }),
};

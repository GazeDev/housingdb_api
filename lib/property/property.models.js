const Joi = require('joi');

module.exports = {
  db: (sequelize, Sequelize) => {
    const Property = sequelize.define('Property', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: Sequelize.STRING,
      machineName: Sequelize.STRING,
      bathroomsMin: Sequelize.DECIMAL,
      bathroomsMax: Sequelize.DECIMAL,
      bedroomsMin: Sequelize.INTEGER,
      bedroomsMax: Sequelize.INTEGER,
      website: Sequelize.STRING,
      contact: Sequelize.STRING,
      body: Sequelize.TEXT,
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
    });

    Property.associate = function (models) {
      models.Property.hasMany(models.PostalAddress);
      models.Property.belongsTo(models.Account, {as: 'Author'});
      models.Property.hasOne(models.GeoCoordinates);
      models.Property.belongsTo(models.Location);
    };

    return Property;
  },
  id: Joi.object().keys({
    id: Joi.string().guid()
  }),
  //machine name duplicate
  machineName: Joi.object().keys({
    machineName: Joi.string()
  }),

  api: Joi.object().keys({
    name: Joi.string(),
    address: Joi.string().required(),
    bathroomsMin: Joi.number().precision(2).min(1).max(9),
    bathroomsMax: Joi.number().precision(2).min(1).max(9),
    bedroomsMin: Joi.number().integer().min(0).max(10),
    bedroomsMax: Joi.number().integer().min(0).max(10),
    website: Joi.string().uri({scheme: ['https','http']}),
    contact: Joi.string(),
    body: Joi.string(),
    AuthorId: Joi.string().guid(),
  }),
  apiPatch: Joi.object().keys({
    name: Joi.string(),
    address: Joi.string(),
    bedroomsMin: Joi.number().integer().min(0).max(10).allow(null),
    bedroomsMax: Joi.number().integer().min(0).max(10).allow(null),
    bathroomsMin: Joi.number().precision(2).min(1).max(9).allow(null),
    bathroomsMax: Joi.number().precision(2).min(1).max(9).allow(null),
    website: Joi.string().uri({scheme: ['https','http']}).allow(""),
    contact: Joi.string().allow(""),
    body: Joi.string().allow(""),
    AuthorId: Joi.string().guid(),
  })
};

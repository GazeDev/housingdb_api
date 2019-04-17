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
      body: Sequelize.TEXT,
      bathroomsMin: Sequelize.DECIMAL,
      bathroomsMax: Sequelize.DECIMAL,
      bedroomsMin: Sequelize.INTEGER,
      bedroomsMax: Sequelize.INTEGER,
    });

    Property.associate = function (models) {
      models.Property.hasMany(models.PostalAddress);
      models.Property.belongsTo(models.Person, {as: 'author'});
      models.Property.hasOne(models.GeoCoordinates);
    };

    return Property;
  },
  id: Joi.object().keys({
    id: Joi.string().guid()
  }),
  api: Joi.object().keys({
    name: Joi.string(),
    address: Joi.string().required(),
    bathroomsMin: Joi.number().precision(2).min(1).max(9),
    bathroomsMax: Joi.number().precision(2).min(1).max(9),
    bedroomsMin: Joi.number().integer().min(0).max(10),
    bedroomsMax: Joi.number().integer().min(0).max(10),
    body: Joi.string(),
  })
};

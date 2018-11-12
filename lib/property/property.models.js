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
    // landlord: Joi.string(),
    // landlordId: Joi.string().guid(),
    body: Joi.string(),
  })
};

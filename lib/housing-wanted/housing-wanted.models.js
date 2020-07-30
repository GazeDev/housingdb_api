const Joi = require('joi');

module.exports = {
  db: (sequelize, Sequelize) => {
    const HousingWanted = sequelize.define('HousingWanted', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: Sequelize.STRING,
      bedrooms: Sequelize.INTEGER,
      bathrooms: Sequelize.DECIMAL,
      contact: Sequelize.STRING,
      body: Sequelize.TEXT,
      status: Sequelize.STRING,
      details: {
        type: Sequelize.JSONB,
        defaultValue: {},

      },
    });

    HousingWanted.associate = function (models) {
      models.HousingWanted.belongsTo(models.Account, {as: 'Author'});
      models.HousingWanted.belongsToMany(models.Location, {through: 'HousingWantedLocation'});
      models.Location.belongsToMany(models.HousingWanted, {through: 'HousingWantedLocation'});
    };

    return HousingWanted;
  },
  id: Joi.object().keys({
    id: Joi.string().guid()
  }),
  api: Joi.object().keys({
    title: Joi.string().required(),
    bedrooms: Joi.number().integer().min(0).max(9),
    bathrooms: Joi.number().precision(2).min(1).max(9),
    contact: Joi.string(),
    body: Joi.string().required(),
    status: Joi.string().valid('active', 'pending', 'inactive'),
    AuthorId: Joi.string().guid(),
    HousingWantedLocationId: Joi.string().guid(),
    details: {},
  })
};
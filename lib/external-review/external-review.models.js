const Joi = require('joi');

module.exports = {
  db: (sequelize, Sequelize) => {
    const ExternalReview = sequelize.define('ExternalReview', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      url: Sequelize.STRING,
      // validate: {isUrl: true},
      date: Sequelize.STRING,
    });

    ExternalReview.associate = function (models) {
      models.ExternalReview.belongsTo(models.Account, {as: 'author'});
      models.Landlord.hasMany(models.ExternalReview, {
        foreignKey: 'reviewable_id',
        constraints: false,
        scope: {
          reviewable: 'landlord'
        }
      });
      models.ExternalReview.belongsTo(models.Landlord, {
        foreignKey: 'reviewable_id',
        constraints: false,
        as: 'landlord'
      });
      models.Property.hasMany(models.ExternalReview, {
        foreignKey: 'reviewable_id',
        constraints: false,
        scope: {
          reviewable: 'property'
        }
      });
      models.ExternalReview.belongsTo(models.Property, {
        foreignKey: 'reviewable_id',
        constraints: false,
        as: 'property'
      });
    };

    return ExternalReview;
  },
  id: Joi.object().keys({
    id: Joi.string().guid()
  }),
  api: Joi.object().keys({
    url: Joi.string().uri({scheme: ['https','http']}).required(),
    date: Joi.date().required(),
  })
};

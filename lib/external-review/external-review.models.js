const Joi = require('joi');

module.exports = {
  db: (sequelize, Sequelize) => {
    const ExternalReview = sequelize.define('ExternalReview', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      url: Sequelize.TEXT,
      date: Sequelize.DATE,

      reviewableType: Sequelize.STRING,
      reviewableId: Sequelize.STRING
    });

    ExternalReview.associate = function (models) {
      models.ExternalReview.belongsTo(models.Account, {as: 'Author'});
      models.Landlord.hasMany(models.ExternalReview, {
        foreignKey: 'reviewableId',
        constraints: false,
        scope: {
          reviewableType: 'landlord'
        }
      });
      models.ExternalReview.belongsTo(models.Landlord, {
        foreignKey: 'reviewableId',
        constraints: false,
        as: 'landlord'
      });
      models.Property.hasMany(models.ExternalReview, {
        foreignKey: 'reviewableId',
        constraints: false,
        scope: {
          reviewableType: 'property'
        }
      });
      models.ExternalReview.belongsTo(models.Property, {
        foreignKey: 'reviewableId',
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

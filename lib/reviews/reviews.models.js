const Joi = require('joi');

module.exports = {
  db: (sequelize, Sequelize) => {
    const Review = sequelize.define('Review', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      subject: Sequelize.STRING,
      body: Sequelize.TEXT,
      rating: Sequelize.INTEGER,
    });

    Review.associate = function (models) {
      models.Review.belongsTo(models.Person, {as: 'author'});
      models.Landlord.hasMany(models.Review, {
        foreignKey: 'reviewable_id',
        constraints: false,
        scope: {
          reviewable: 'landlord'
        }
      });
      models.Review.belongsTo(models.Landlord, {
        foreignKey: 'reviewable_id',
        constraints: false,
        as: 'landlord'
      });
      models.Property.hasMany(models.Review, {
        foreignKey: 'reviewable_id',
        constraints: false,
        scope: {
          reviewable: 'property'
        }
      });
      models.Review.belongsTo(models.Property, {
        foreignKey: 'reviewable_id',
        constraints: false,
        as: 'property'
      });
     //TODO: create association that takes landlord OR property
    };

    return Review;
  },
  id: Joi.object().keys({
    id: Joi.string().guid()
  }),
  api: Joi.object().keys({
    subject: Joi.string().required(),
    // landlord: Joi.string(),
    // landlordId: Joi.string().guid(),
    body: Joi.string().required(),
    rating: Joi.number().integer().min(1).max(5).required()
  })
};

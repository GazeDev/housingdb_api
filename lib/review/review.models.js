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

      reviewableType: Sequelize.STRING,
      reviewableId: Sequelize.STRING
    });

    Review.associate = function (models) {
      models.Review.belongsTo(models.Account, {as: 'Author'});
      models.Landlord.hasMany(models.Review, {
        foreignKey: 'reviewableId',
        constraints: false,
        scope: {
          reviewableType: 'landlord',
        }
      });
      models.Review.belongsTo(models.Landlord, {
        foreignKey: 'reviewableId',
        constraints: false,
        as: 'landlord',
      });
      models.Property.hasMany(models.Review, {
        foreignKey: 'reviewableId',
        constraints: false,
        scope: {
          reviewableType: 'property',
        }
      });
      models.Review.belongsTo(models.Property, {
        foreignKey: 'reviewableId',
        constraints: false,
        as: 'property',
      });
    };

    return Review;
  },
  id: Joi.object().keys({
    id: Joi.string().guid()
  }),
  api: Joi.object().keys({
    subject: Joi.string().required(),
    body: Joi.string().required(),
    rating: Joi.number().integer().min(1).max(5).required(),
  })
};

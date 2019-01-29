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
      models.Review.belongsTo(models.landlord, {foreignKey: 'landlordId'});
      models.Review.belongsTo(models.Person, {as: 'author'});
      models.Review.belongsTo(models.Property, foreignKey: 'propertyId');
    };

    return Review;
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

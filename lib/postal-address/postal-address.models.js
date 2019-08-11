const Joi = require('joi');

module.exports = {
  db: (sequelize, Sequelize) => {
    const PostalAddress = sequelize.define('PostalAddress', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      hash: Sequelize.STRING,
      addressNumber: Sequelize.STRING,
      addressRoute: Sequelize.STRING,
      addressNeighborhood: Sequelize.STRING,
      addressCounty: Sequelize.STRING,
      // schema.org
      streetAddress: Sequelize.STRING,
      addressLocality: Sequelize.STRING,
      addressRegion: Sequelize.STRING,
      addressCountry: Sequelize.STRING,
      postalCode: Sequelize.STRING,
    });

    return PostalAddress;
  },
  id: Joi.object().keys({
    id: Joi.string().guid().required(),
  }),
  apiHash: Joi.object().keys({
    hash: Joi.string().required(),
  })
};

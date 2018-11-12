const Joi = require('joi');
// const PostalAddressDB = require('../postal-address').models.PostalAddressDB;

module.exports = {
  db: (sequelize, Sequelize) => {
    const Person = sequelize.define('Person', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      username: Sequelize.STRING
    });

    /* NOTE: this will be problematic if we do a call of all addresses to display on
              a map, when what we want is property addresses. figure this out */
    // PersonDB.address = PersonDB.hasOne(AddressDB);

    return Person;
  },
  id: Joi.object().keys({
    id: Joi.string().guid().required(),
  }),
  api: Joi.object().keys({
    username: Joi.string().required(),
  })
};

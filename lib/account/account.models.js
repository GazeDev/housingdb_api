const Joi = require('joi');
// const PostalAddressDB = require('../postal-address').models.PostalAddressDB;

module.exports = {
  db: (sequelize, Sequelize) => {
    const Account = sequelize.define('Account', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      externalId: Sequelize.STRING
    });

    /* NOTE: this will be problematic if we do a call of all addresses to display on
              a map, when what we want is property addresses. figure this out */
    // AccountDB.address = AccountDB.hasOne(AddressDB);

    return Account;
  },
  id: Joi.object().keys({
    id: Joi.string().guid().required(),
  }),
  api: Joi.object().keys({
    username: Joi.string().required(),
  })
};

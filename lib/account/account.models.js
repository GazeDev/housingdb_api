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
      externalId: Sequelize.STRING,
      // userData should only be exchanged between the api and the user's client
      userData: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      // TODO: future implementation of publicData
      // publicData should is viewable by anyone able to view this account
      // publicData: {
      //   type: Sequelize.JSONB,
      //   defaultValue: {},
      // },
    });

    /* NOTE: this will be problematic if we do a call of all addresses to display on
              a map, when what we want is property addresses. figure this out */
    // AccountDB.address = AccountDB.hasOne(AddressDB);

    return Account;
  },
  id: Joi.object().keys({
    accountId: Joi.string().guid().required(),
  }),
  api: Joi.object().keys({
    username: Joi.string().required(),
  }),
  apiPatch: Joi.object().keys({
    userData: Joi.object().keys({
      info: Joi.object().keys({
        userType: Joi.string().valid('tenant', 'landlord', 'other'),
        userTypeOther: Joi.string(),
        address: Joi.string(),
        landlord: Joi.string(),
        referralSource: Joi.string(),
      }),
      // preferences: Joi.object().keys({}) // Future save space for preferences
    }),
  }),
};

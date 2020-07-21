const Joi = require('joi');

module.exports = {
  db: (sequelize, Sequelize) => {
    const HousingWanted = sequelize.define('HousingWanted', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      beds: Sequelize.INTEGER,
      baths: Sequelize.DECIMAL,
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

};

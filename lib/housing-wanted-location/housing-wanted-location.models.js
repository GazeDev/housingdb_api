module.exports = {
  db: (sequelize, Sequelize) => {
    const HousingWantedLocation = sequelize.define('HousingWantedLocation', {
      
    });

    return HousingWantedLocation;
  },
  
};
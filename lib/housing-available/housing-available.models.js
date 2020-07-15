const Joi = require('joi');
// We will associate data about the property itself w/the data contained herein pertaining to said rental;
const propertyModels = require('../property/property.models.js');
// We will associate landlord data w/the rental listing author, which we can assume will be a landlord;
const landlordModels = require('../landlord/landlord.models.js');

// Define the schema representing a single rental listing, a.k.a. a HousingAvailable object;
module.exports = {
  db: (sequelize, Sequelize) => {
    const HousingAvailable = sequelize.define("HousingAvailable", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      // 'AuthorId' is our foreign key to 'Landlord.id';
      AuthorId: Sequelize.STRING,
      // 'contact' will be the name of the person to contact,
      // usually the Landlord posting the listing, although said
      // Landlord should be able to enter their name manually here,
      // in case they go by a nickname, or 
      // have someone else managing their property; the potential renter will
      // still be able to see which user (Landlord) posted the listing;
      contact: Sequelize.STRING,
      // 'title' is a headline or tagline the landlord can put to catch 
      // the attention of potential renters, e.g. "Great 3-bedroom townhouse in Lower Queen Anne!";
      title: Sequelize.STRING,
      // 'body' will be used by the author of the post
      // to describe the property in their own words;
      body: Sequelize.TEXT,
      // status: 'available', 'unavailable', 'pending', 'claimed', 'active':
      status: Sequelize.ARRAY[Sequelize.STRING],
      details: {
        rentCost: Sequelize.STRING,
        applicationFee: Sequelize.STRING,
        securityDeposit: Sequelize.STRING,
        floorSpace: Sequelize.STRING,
        washerAndDryer: {
          hasOnsite: Sequelize.BOOLEAN,
          isCoinOperated: Sequelize.BOOLEAN,
        },
        isFurnished: Sequelize.STRING,
        airConditioned: Sequelize.STRING,
        numberOfBedrooms: Sequelize.DECIMAL,
        numberOfBathrooms: Sequelize.DECIMAL,
        allowsPets: Sequelize.BOOLEAN,
        petDeposit: Sequelize.STRING,
        nonSmoking: Sequelize.BOOLEAN,
        // in 'transportationOptions', user can detail which (if any) transportation
        // amenities lie near the rental, e.g. bus line (and routes), elevated train, subway, etc.;
        transportationOptions: Sequelize.STRING,
        onsiteParking: {
          hasOnsiteParking: Sequelize.STRING,
          parkingFee: Sequelize.STRING,
        },
        lease: {
          dateBegins: Sequelize.DATE,
          durationOfLease: Sequelize.STRING,
          optionToRenew: Sequelize.BOOLEAN,
        },
        utilitiesCovered: Sequelize.STRING,
        isSublet: Sequelize.STRING,
        rentalType: ['house', 'multi-unit house', 'apartment', 'condo', 'other'],
        rentControlled: Sequelize.BOOLEAN,
        // 'locationOfUnitInBuilding' should be a non-essential string 
        // detailing where the unit is, relatively;
        // i.e. "on street", "by laundry room", "by recycling/garbage", etc.;
        locationOfUnitInBuilding: Sequelize.STRING,
      },
      phone: Sequelize.STRING,
      phoneCountry: Sequelize.STRING,
      phoneNational: Sequelize.STRING,
      phoneExtension: Sequelize.STRING,
      preferredContactMethod: ["email", "telephone", "fax", "text message"],
      website: Sequelize.TEXT,
      email: Sequelize.STRING,
      address: Sequelize.STRING,
      // 'location' can be used to provide geolocation coordinates, 
      // which in turn can be used to fetch a Google Maps view
      // or other visual/interactive data about where the property is;
      location: Sequelize.GEOMETRY,
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
    });

    HousingAvailable.associate = (models) => {
      // Here, we associate our 'author' property with the Landlord who 
      // is posting this, which is in turn associated with Account (user who is logged-in);
      models.HousingAvailable.belongsTo(models.Landlord, {as: 'Author'});  
      models.HousingAvailable.hasOne(models.Property, {as: 'RentalProperty'} );
    };
    return HousingAvailable;
  },
};

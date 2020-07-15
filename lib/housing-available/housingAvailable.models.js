const Joi = require('joi');
// We will associate data about the property itself w/the data contained herein pertaining to said rental;
const propertyModels = require('../property/property.models.js');
// We will associate landlord data w/the rental listing author, which we can assume will be a landlord;
const landlordModels = require('../landlord/landlord.models.js');

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
      // 'contactName' will be the name of the person to contact,
      // usually the Landlord posting the listing, although said
      // Landlord should be able to enter their name manually here,
      // in case they go by a nickname, or 
      // have someone else managing their property; the potential renter will
      // still be able to see which user (Landlord) posted the listing;
      contactName: Sequelize.STRING,
      // 'title' is a headline or tagline the landlord can put to catch 
      // the attention of potential renters, e.g. "Great 3-bedroom townhouse in Lower Queen Anne!";
      title: Sequelize.STRING,
      // 'body' will be used by the author of the post
      // to describe the property in their own words;
      body: Sequelize.TEXT,
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

  id: Joi.object().keys({
    id: Joi.string().guid()
  }),
  machineName: Joi.object().keys({
    machineName: Joi.string()
  }),
  api: Joi.object().keys({
    quickInfo: Joi.string(),
    contactName: Joi.string(), // TODO: should be required if no quick info
    title: Joi.string(),
    body: Joi.string(),
    details: {
      rentCost: Joi.string(),
      applicationFee: Joi.string(),
      securityDeposit: Joi.string(),
      floorSpace: Joi.string(),
      washerAndDryer: {
        hasOnsite: Joi.boolean(),
        isCoinOperated: Joi.boolean(),
      },
      isFurnished: Joi.string(),
      airConditioned: Joi.string(),
      numberOfBedrooms: Joi.number(),
      numberOfBathrooms: Joi.number(),
      allowsPets: Joi.boolean(),
      petDeposit: Joi.string(),
      nonSmoking: Joi.boolean(),
      // in 'transportationOptions', we detail which (if any) transportation
      // amenities lie near the rental, e.g. bus line (and routes), elevated train, subway, etc.;
      transportationOptions: Joi.string(),
      onsiteParking: {
        hasOnsiteParking: Joi.string(),
        parkingFee: Joi.string(),
      },
      lease: {
        dateBegins: Joi.date(),
        durationOfLease: Joi.string(),
        optionToRenew: Joi.boolean(),
      },
      utilitiesCovered: Joi.string(),
      isSublet: Joi.string(),
      rentalType: Joi.array(),
      rentControlled: Joi.boolean(),
      // 'locationOfUnitInBuilding' should be a non-essential string 
      // detailing where the unit is, relatively;
      // i.e. "on street", "by laundry room", "by recycling/garbage", etc.;
      locationOfUnitInBuilding: Joi.string(),
    },
    phone: Joi.string(),
    // phoneCountry: Joi.string(),
    // phoneNational: Joi.string(),
    // phoneExtension: Joi.string(),
    preferredContactMethod: Joi.string().array(),
    website: Joi.string().uri({scheme: ['https','http']}),
    email: Joi.string().email(),
    AuthorId: Joi.string().guid(),
  }),
  apiPatch: Joi.object().keys({
    AuthorId: Joi.string().guid(),
    contactName: Joi.string().allow(""),
    title: Joi.string().required(),
    details: {
      rentCost: Joi.string().required(),
      numberOfBedrooms: Joi.number().required(),
      numberOfBathrooms: Joi.number().required(),
      allowsPets: Joi.boolean().required(),
      onsiteParking: {
        hasOnsiteParking: Joi.string().required(),
      },
      lease: {
        dateBegins: Joi.date().required(),
        durationOfLease: Joi.string().required(),
      },
      utilitiesCovered: Joi.string().allow(""),
    },
    phone: Joi.string().required(),
    email: Joi.string().email().allow(""),
    website: Joi.string().uri({scheme: ['https','http']}).allow(""),
    body: Joi.string().allow(""),
    preferredContactMethod: Joi.array().allow(""),
  }),
  apiFilterQuery: Joi.object({
    search: Joi.string().optional(),
    contactName: Joi.string().optional(),
    phone: Joi.string().optional(),
    email: Joi.string().optional(),
    // If search is used, other params shouldn't be
  }).without('search', ['name', 'phone', 'email']),
  object: Joi.object().keys({
    contactName: Joi.string(),
    AuthorId: Joi.string().guid(),
    title: Joi.string(),
    body: Joi.string(),
    details: {
      rentCost: Joi.string(),
      numberOfBedrooms: Joi.number(),
      numberOfBathrooms: Joi.number(),
      allowsPets: Joi.boolean(),
      onsiteParking: {
        hasOnsiteParking: Joi.string(),
      },
      lease: {
        dateBegins: Joi.date(),
        durationOfLease: Joi.string(),
      },
    },
    phone: Joi.string(),
    phoneCountry: Joi.number(),
    phoneNational: Joi.number(),
    phoneExtension: Joi.number(),
    preferredContactMethod: Joi.array(),
    website: Joi.string().uri({scheme: ['https','http']}),
    email: Joi.string().email(),
  }),
  propertyApiFilterQuery: propertyModels.apiFilterQuery,
  landlordApiFilterQuery: landlordModels.apiFilterQuery,
};

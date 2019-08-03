const Joi = require('joi');
module.exports = (models) => {
  const Boom = require('boom');
  const landlordModels = require('./landlord.models');
  const propertyControllers = require('../property/property.controllers')(models);

  return {
    getLandlords: function(request, h) {
      return models.Landlord.findAll({})
      .then(response => {
        return response;
      })
      .catch(error => {
        return error;
      });
    },
    getLandlordProperties: function(request, h) {
      let propertyOptions = {
        ...{
          where: {
            LandlordId: request.params.id,
          }
        },
        ...propertyControllers.lib.getPropertyOptions()
      }
      return models.Property.findAll(propertyOptions)
      .then(response => {
        return response;
      })
      .catch(error => {
        return error;
      });
    },
    getLandlord: async function(request, h) {
      const returnLandlord = getLandlord(request.params.id);
      return returnLandlord;
    },
    getLandlordsSchema: function(request, h) {
      const convert = require('joi-to-json-schema');
      return convert(landlordModels.api);
    },
    postLandlord: async function(request, h) {
      /*
        we should be receiving an object with an optional quick info field
        if that quick info field exists it can be used to fill in name, email,
        and/or phone number if valid. the resulting object must have at least a
        name, which can be the value of email or phone number. name, email, and
        phone must be unique. quick info only fills in un-filled in fields, so
        if name, email, or phone is set, we shouldn't overwrite them.
      */
      // take information in, parse it,

      let landlord = request.payload;
      let quickInfo;
      if (landlord.quickInfo) {
        quickInfo = landlord.quickInfo;
        delete landlord.quickInfo;
      }

      if (landlord.phone) {
        let phoneParse = parseInfoPhone(landlord.phone);
        landlord.phone = phoneParse.formatted;
        landlord.phoneCountry = phoneParse.countryCode;
        landlord.phoneNational = phoneParse.nationalNumber;
        if (phoneParse.extension) {
          landlord.phoneExtension = phoneParse.extension;
        }
      }

      // apply it where applicable,
      if (quickInfo) {
        let parse = parseInfo(quickInfo, ['email', 'phone']);
        if (!landlord.name) {
          if (parse.remainder) {
            landlord.name = parse.remainder;
          } else {
            landlord.name = quickInfo;
          }
        }

        if (!landlord.email && parse.email) {
          landlord.email = parse.email;
        }

        if (!landlord.phone && parse.phone) {
          landlord.phone = parse.phone.formatted;
          landlord.phoneCountry = parse.phone.countryCode;
          landlord.phoneNational = parse.phone.nationalNumber;
          if (parse.phone.extension) {
            landlord.phoneExtension = parse.phone.extension;
          }
        }
      }


      // revalidate
      try {
        let revalidate = await Joi.validate(landlord, landlordModels.object);
      } catch (e) {
        throw Boom.badImplementation('Error during lookupLandlordFromName(landlord.name). ' + e);
      }

      // then see if landlord exists
      let landlordName = await lookupLandlordFromName(landlord.name);
      if (Array.isArray(landlordName) && landlordName.length) {
        throw Boom.badData('Landlord with that name already exists');
      }

      if (landlord.email) {
        let landlordEmail = await lookupLandlordFromEmail(landlord.email);
        if (Array.isArray(landlordEmail) && landlordEmail.length) {
          throw Boom.badData('Landlord with that email already exists');
        }
      }

      if (landlord.phoneNational) {
        let landlordPhone = await lookupLandlordFromPhoneNational(landlord.phoneNational.toString());
        if (Array.isArray(landlordPhone) && landlordPhone.length) {
          throw Boom.badData('Landlord with that phone already exists');
        }
      }

      // then if not, we create the landlord
      let newLandlord;
      try {
        newLandlord = await createLandlord(landlord);
      } catch (e) {
        throw Boom.badImplementation('Error during createLandlord(landlord). ' + e);
      }

      return h
        .response(newLandlord);

    },
    deleteLandlord: function(request, h) {
      return models.Landlord.destroy({
        where: {
          id: request.params.id,
        },
      })
      .then(response => {
        return response;
      });
    },
    addLandlordToProperty: async function(request, h) {
      let landlordId = request.payload.id;
      let propertyId = request.params.id;
      return await models.Property.update(
        {
          LandlordId: landlordId,
        },
        {
          where: {
            id: propertyId,
          }
        }
      );
    },
    // postLandlordProperty: async function(request, h) {
    //   let landlord;
    //   if (request.payload.landlord) {
    //     landlord = await getLandlord(request.payload.landlord);
    //     delete request.payload.landlord;
    //   }
    //   const newPropertyH = await propertyControllers.postProperty(request, h);
    //   let newProperty = newPropertyH.source;
    //   console.log('newProperty');
    //   console.log(newPropertyH);
    //   if (landlord) {
    //     console.log('landlord:');
    //     console.log(landlord);
    //     await landlord.addProperties(newProperty);
    //     newProperty = await newProperty.reload();
    //   }
    //
    //   return h.response(newProperty);
    // },
    lib: {
      getLandlord: getLandlord,
      // lookupLandlordFromText: lookupLandlordFromText,
      // createLandlordFromText: createLandlordFromText,
      parseInfo: parseInfo,
    },
  };

  function getLandlord(id) {
    return models.Landlord.findByPk(id)
    .then(response => {
      return response;
    })
    .catch(error => {
      return error;
    });
  }

  function createLandlord(landlordObject) {
    return models.Landlord.create(landlordObject)
    .then(response => {
      return response;
    })
    .catch(error => {
      return error;
    });
  }

  // async function lookupLandlordFromText(text) {
  //   // parse text
  //   let parse = parseInfo(text, ['email', 'phone']);
  //   console.log('landlord parse info');
  //   console.log(parse);
  //   // landlord lookup based on each parsed element
  //   if (parse.email) {
  //     let landlords = await lookupLandlordFromEmail(parse.email);
  //     console.log('email landlords:');
  //     console.log(landlords);
  //     if (Array.isArray(landlords) && landlords.length) {
  //       console.log('return email landlords');
  //       return landlords[0];
  //     }
  //   }
  //
  //   if (parse.phone) {
  //     let landlords = await lookupLandlordFromPhoneNational(parse.phone.nationalNumber);
  //     console.log('phone landlords:');
  //     console.log(landlords);
  //     if (Array.isArray(landlords) && landlords.length) {
  //       return landlords[0];
  //     }
  //   }
  //
  //   let name = parse.remainder || text;
  //   let landlords = await lookupLandlordFromName(name);
  //   console.log('name landlords:');
  //   console.log(landlords);
  //   if (Array.isArray(landlords) && landlords.length) {
  //     return landlords[0];
  //   }
  //   // once we find one, return landlord instance
  //   // otherwise return false
  //   console.log('find landlord false');
  //   return false;
  // }

  // function createLandlordFromText(text) {
  //   // parse text
  //   let parse = parseInfo(text, ['email', 'phone']);
  //   // build landlord object from parsed elements
  //   let landlordObject = {};
  //   if (parse.remainder) {
  //     landlordObject.name = parse.remainder;
  //   } else {
  //     landlordObject.name = text;
  //   }
  //
  //   if (parse.email) {
  //     landlordObject.email = parse.email;
  //   }
  //
  //   if (parse.phone) {
  //     landlordObject.phone = parse.phone.formatted;
  //     landlordObject.phoneCountry = parse.phone.countryCode;
  //     landlordObject.phoneNational = parse.phone.nationalNumber;
  //     landlordObject.phoneExtension = parse.phone.extension;
  //   }
  //
  //   return createLandlord(landlordObject);
  // }

  function getLandlordProperties(landlordId) {
    let propertyOptions = {
      ...{
        where: {
          reviewableType: reviewableType,
          reviewableId: reviewableId,
        },
      },
      ...getPropertyOptions(),
    };
    return models.Property.findall();
  }

  function lookupLandlordFromEmail(email) {
    return models.Landlord.findAll({
      where: {
        email: email,
      }
    })
    .then(response => {
      return response;
    })
    .catch(error => {
      return error;
    });
  }

  function lookupLandlordFromPhoneNational(phoneNational) {
    return models.Landlord.findAll({
      where: {
        phoneNational: phoneNational,
      }
    })
    .then(response => {
      return response;
    })
    .catch(error => {
      return error;
    });
  }

  function lookupLandlordFromName(name) {
    return models.Landlord.findAll({
      where: {
        name: name,
      }
    })
    .then(response => {
      return response;
    })
    .catch(error => {
      return error;
    });
  }

  function parseInfo(text, searches, remove = true) {
    let values = {};
    for (let i=0; i<searches.length; i++) {
      let search = searches[i];
      if (search == 'email') {
        let email = parseInfoEmail(text);
        if (email) {
          values.email = email;
          if (remove) {
            text = parseInfoRemove(email, text);
          }
        }
      } else if (search == 'phone') {
        let phone = parseInfoPhone(text);
        if (phone) {
          values.phone = phone;
          if (remove) {
            text = parseInfoRemove(phone.original, text);
          }
        }
      }

    }
    values.remainder = text.trim();
    return values;

  }

  function parseInfoEmail(text) {
    let parts = text.split(' ');
    const Joi = require('joi');
    for (let i=0; i<parts.length; i++) {
      let part = parts[i];
      let result = Joi.validate(part, Joi.string().email().required());
      if (result.error === null) {
        return part;
      }
    }
    return false;
  }

  function parseInfoPhone(text) {
    const expression = /[()\-+.0-9]{1}[()\-\ +.0-9]{9,17}(?:(?:x|ext)[.]?[ ]?[0-9]{1,4})?/;
    let matches = text.match(expression);

    if (!matches) {
      return false;
    }

    // Require `PhoneNumberFormat`.
    const PNF = require('google-libphonenumber').PhoneNumberFormat;
    // Get an instance of `PhoneNumberUtil`.
    const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
    let number;
    try {
      number = phoneUtil.parse(matches[0], "US");
    } catch (e) {
      return false;
    }

    let isValid = phoneUtil.isValidNumber(number);
    if (!isValid) {
      return false;
    }

    let returnNumber = {
      original: matches[0],
      // formatted: String(phoneUtil.format(number, PNF.NATIONAL)),
      formatted: phoneUtil.format(number, PNF.NATIONAL),
      // countryCode: String(number.getCountryCode()),
      countryCode: number.getCountryCode(),
      // nationalNumber: String(number.getNationalNumber()),
      nationalNumber: number.getNationalNumber(),
      // extension: String(number.getExtension()),
      extension: number.getExtension(),
    };

    return returnNumber;
  }

  function parseInfoRemove(string, subject) {
    var index = subject.indexOf(string);
  	if (index === -1) {
  		return subject;
  	}
  	return subject.slice(0, index) + subject.slice(index + string.length);
  }

};

const Joi = require('joi');
module.exports = (models) => {

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

      let quick_info;
      if (landlord.quick_info) {
        quick_info = landlord.quick_info;
        console.log('quick info');
        console.log(quick_info);
        delete landlord.quick_info;
      }

      if (landlord.phone) {
        let phoneParse = parseInfoPhone(landlord.phone);

        landlord.phone = phoneParse.formatted;
        landlord.phoneCountry = phoneParse.countryCode;
        landlord.phoneNational = phoneParse.nationalNumber;
        landlord.phoneExtension = phoneParse.extension;
      }

      // apply it where applicable,
      if (quick_info) {
        let parse = parseInfo(quick_info, ['email', 'phone']);
        if (!landlord.name) {
          if (parse.remainder) {
            landlord.name = parse.remainder;
          } else {
            landlord.name = text;
          }
        }

        if (!landlord.email && parse.email) {
          landlord.email = parse.email;
        }

        if (!landlord.phone && parse.phone) {
          landlord.phone = parse.phone.formatted;
          landlord.phoneCountry = parse.phone.countryCode;
          landlord.phoneNational = parse.phone.nationalNumber;
          landlord.phoneExtension = parse.phone.extension;
        }
      }



      // revalidate
      let revalidate = Joi.validate(landlord, landlordModels.object);
      if (revalidate.error !== null) {
        // There is an error during re-validation
        return h.response(revalidate);
      }

      // then see if landlord exists
      try {
        let landlordName = await lookupLandlordFromName(landlord.name);
        if (Array.isArray(landlordName) && landlordName.length) {
          return h.response({error: 'A Landlord with that name already exists'});
        }
      } catch (e) {

      }


      if (landlord.email) {
        let landlordEmail = await lookupLandlordFromEmail(landlord.email);
        if (Array.isArray(landlordEmail) && landlordEmail.length) {
          return h.response({error: 'A Landlord with that email already exists'});
        }
      }

      if (landlord.phoneNational) {
        let landlordPhone = await lookupLandlordFromPhoneNational(landlord.phoneNational)
        if (Array.isArray(landlordPhone) && landlordPhone.length) {
          return h.response({error: 'A Landlord with that phone already exists'});
        }
      }

      // then if not, we create the landlord
      const newLandlord = await createLandlord(landlord);
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
    postLandlordProperty: async function(request, h) {
      let landlord;
      if (request.payload.landlord) {
        landlord = await getLandlord(request.payload.landlord);
        delete request.payload.landlord;
      }
      const newPropertyH = await propertyControllers.postProperty(request, h);
      let newProperty = newPropertyH.source;
      console.log('newProperty');
      console.log(newPropertyH);
      if (landlord) {
        console.log('landlord:');
        console.log(landlord);
        await landlord.addProperties(newProperty);
        newProperty = await newProperty.reload();
      }

      return h.response(newProperty);
    },
    lib: {
      getLandlord: getLandlord,
      // lookupLandlordFromText: lookupLandlordFromText,
      // createLandlordFromText: createLandlordFromText,
      parseInfo: parseInfo,
    },
  };

  function getLandlord(id) {
    return models.Landlord.findById(id)
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
      formatted: phoneUtil.format(number, PNF.NATIONAL),
      countryCode: number.getCountryCode().toString(),
      nationalNumber: number.getNationalNumber().toString(),
      extension: number.getExtension().toString(),
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

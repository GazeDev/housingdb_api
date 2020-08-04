const Joi = require('joi');
module.exports = (models) => {
  const Boom = require('boom');
  const Sequelize = require('sequelize');
  const Op = Sequelize.Op;
  const landlordModels = require('./landlord.models');
  const accountLib = require('../account/account.controllers')(models).lib;

  return {
    adminGenerateMachineNames: async function(request, h) {
      ensureAdmin(request);
      let machineNamelessLandlords;
      try {
        // regexp matches machine names that contain parenthesis or brackets
        let regexp = '[()\\[\\]]';
        // Searches for null machine names, or ones that match regexp
        machineNamelessLandlords = await getAllLandlordsByMachineName({
          [Op.or]: {
            [Op.regexp]: regexp,
            [Op.is]: null,
          },
        });
        for (let landlord of machineNamelessLandlords) {
          let machineName = await createMachineName(landlord.name);
          landlord.update({machineName: machineName});
        }
      } catch (e) {
        throw Boom.badImplementation('Error during adminGenerateMachineNames. ' + e);
      }
      return machineNamelessLandlords;
    },
    getLandlords: async function(request, h) {
      let returnLandlords;
      try {
        returnLandlords = await getLandlords(request.query);
      } catch (e) {
        throw Boom.badImplementation('Error during getLandlords(request.query). ' + e);
      }
      return h
        .response(returnLandlords);
    },
    getLandlordProperties: function(request, h) {
      let propertyOptions = propertyLib.getPropertyOptions(request.query);
      if (propertyOptions.where === undefined) {
        propertyOptions.where = {};
      }
      propertyOptions.where.LandlordId = request.params.id;
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
    getLandlordByMachineName: async function(request, h) {
      const returnLandlord = await getLandlordByMachineName(request.params.machineName);
      // TODO: use try/catch with await?
      return h
        .response(returnLandlord);
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
      let landlord = request.payload;
      let account;
      /*
        # Require Account for submitting fields other than quickInfo
      */
      let landlordKeys = Object.keys(landlord);
      if (landlordKeys.length !== 1 || landlordKeys[0] !== 'quickInfo') {
        // not only quickInfo set
        let noAuth;
        try {
          if (request.auth.credentials) {
            account = await accountLib.getAccount(request.auth.credentials);
          } else {
            noAuth = true;
          }

        } catch (e) {
          throw Boom.badImplementation('Error during getAccount(request.auth.credentials). ' + e);
        }

        if (account === null || noAuth) {
          // User doesn't have an account, operation not allowed
          throw Boom.badRequest('Must have an Account to create a Landlord with any field other than quickInfo');
        }
      }

      /* Restrict AuthorId to same user, or SuperAdmin */
      if (landlord.AuthorId) {
        // If AuthorId is set then we have already passed auth and account lookup
        // This is because if AuthorId is set then not only quickInfo is set
        if (
          landlord.AuthorId !== account.id  &&
          request.auth.credentials.subjectId !== process.env.SUPER_ADMIN
        ) {
          throw Boom.badRequest('Landlord.AuthorId must match your Account ID or you must be a Super Admin');
        }
      }

      // take information in, parse it,

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
        throw Boom.badImplementation('Error during Landlord revalidation.' + e);
      }

      // then see if landlord exists
      let landlordName = await lookupLandlordFromName(landlord.name);
      if (Array.isArray(landlordName) && landlordName.length) {
        let error = Boom.badData('Landlord with that name already exists');
        error.output.headers["Content-Location"] = landlordName[0].id;
        throw error;
      }

      if (landlord.email) {
        let landlordEmail = await lookupLandlordFromEmail(landlord.email);
        if (Array.isArray(landlordEmail) && landlordEmail.length) {
          let error = Boom.badData('Landlord with that email already exists');
          error.output.headers["Content-Location"] = landlordEmail[0].id;
          throw error;
        }
      }

      if (landlord.phoneNational) {
        let landlordPhone = await lookupLandlordFromPhoneNational(landlord.phoneNational.toString());
        if (Array.isArray(landlordPhone) && landlordPhone.length) {
          let error = Boom.badData('Landlord with that phone already exists');
          error.output.headers["Content-Location"] = landlordPhone[0].id;
          throw error;
        }
      }

      // Convert validated information into computed fields
      landlord.machineName = await createMachineName(landlord.name);

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
    patchLandlord: async function(request, h) {
      let landlord = request.payload;
      let landlordId = request.params.id;
      let landlordInstance = await getLandlord(landlordId);

      // Make sure landlord exists
      if (landlordInstance === null) {
        throw Boom.badRequest('Landlord does not exist');
      }

      // Will throw if no account found
      let account = await ensureAccount(request);

      // NOTE: Only Admins can submit 'name', or 'AuthorId' fields
      if (request.auth.credentials.subjectId !== process.env.SUPER_ADMIN) {
        if (landlordInstance.AuthorId !== account.id) {
          throw Boom.badRequest('Landlord.AuthorId must match your Account ID or you must be a Super Admin');
        }

        if (request.payload.hasOwnProperty('AuthorId')) {
          throw Boom.badRequest('Only an Admin can change the AccountId');
        }

        if (request.payload.hasOwnProperty('name')) {
          throw Boom.badRequest('Only an Admin can change the name');
        }
      }

      if (landlord.phone) {
        let phoneParse = parseInfoPhone(landlord.phone);
        if (phoneParse.formatted === undefined) {
          throw Boom.badRequest('Not a valid phone number');
        }

        let landlordPhone = await lookupLandlordFromPhoneNational(phoneParse.nationalNumber.toString());
        if (Array.isArray(landlordPhone) && landlordPhone.length) {
          // Don't throw error if the found landlord is the same as what we're editing
          if (landlordPhone[0].id !== landlordId) {
            let error = Boom.badData('Landlord with that phone already exists');
            error.output.headers["Content-Location"] = landlordPhone[0].id;
            throw error;
          }
        }

        landlord.phone = phoneParse.formatted;
        landlord.phoneCountry = phoneParse.countryCode;
        landlord.phoneNational = phoneParse.nationalNumber;
        if (phoneParse.extension) {
          landlord.phoneExtension = phoneParse.extension;
        } else {
          landlord.phoneExtension = null;
        }
      }

      if (landlord.email) {
        let landlordEmail = await lookupLandlordFromEmail(landlord.email);
        if (Array.isArray(landlordEmail) && landlordEmail.length) {
          let error = Boom.badData('Landlord with that phone already exists');
          error.output.headers["Content-Location"] = landlordEmail[0].id;
          throw error;
        }
      }

      if (landlord.name) {
        // NOTE: there's no duplicate protection here for name, but only admins
        // can change landlord name, which puts the burden on an admin not to
        // change the name of a landlord to an already existing landlord
        landlord.machineName = await createMachineName(landlord.name);
      }

      // landlord.website still on landlord payload

      // landlord.body still on landlord payload

      return await landlordInstance.update(landlord);
    },
    deleteLandlord: function(request, h) {
      // User must be Super Admin to do this action
      if (request.auth.credentials.subjectId !== process.env.SUPER_ADMIN) {
        throw Boom.forbidden('Must have an Admin Account to delete a Property');
      }
      return models.Landlord.destroy({
        where: {
          id: request.params.id,
        },
      })
      .then(response => {
        return h
        .response(response)
        .code(202);
      });
    },
    addLandlordToProperty: async function(request, h) {
      let landlordId = request.payload.id;
      let propertyId = request.params.id;

      let propertyInstance = await propertyLib.getProperty(propertyId);

      // Make sure property exists
      if (propertyInstance === null) {
        throw Boom.badRequest('Property does not exist');
      }

      let existingLandlordId = propertyInstance.LandlordId;

      if (existingLandlordId !== null) {
        if (existingLandlordId === landlordId) {
          throw Boom.badRequest('This Property already has this Landlord assigned');
        }
        if (process.env.SUPER_ADMIN !== request.auth.credentials.subjectId) {
          throw Boom.badRequest('This Property already has a Landlord assigned, and can only be changed by an Admin');
        }
      }

      let landlordInstance = await getLandlord(landlordId);

      // Make sure landlord exists
      if (landlordInstance === null) {
        throw Boom.badRequest('Landlord does not exist');
      }

      // Increase the targeted landlord metadata.propertyCount
      let metadata = await landlordInstance.reload().get("metadata");

      let propertyCount = metadata.propertyCount;

      if (propertyCount === undefined) {
        propertyCount = 0;
      }

      propertyCount = propertyCount + 1;

      try {
        await landlordInstance.set("metadata.propertyCount", propertyCount).save();
      } catch (e) {
        console.log('Error incrementing the metadata.propertyCount', e);
      }

      // Attach the LandlordId to the Property
      return await propertyInstance.update({
        "LandlordId": landlordId,
      });
    },
    getAccountLandlords: async function(request, h) {
      let account;
      try {
        account = await accountLib.getAccount(request.auth.credentials);
      } catch (e) {
        throw Boom.badImplementation('Error during getAccount(request.auth.credentials). ' + e);
      }

      if (account === null) {
        throw Boom.badRequest('Must have an Account to get own Landlords');
      }

      return await getAccountLandlords(account.id);
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

  function getLandlords(queryParams = {}) {
    return models.Landlord.findAll(getLandlordOptions(queryParams));
  }

  function getLandlordOptions(queryParams) {
    let whereParams = {};
    let landlordOptions = {};
    // hasOwnProperty workaround because query object overwritten, see:
    // https://github.com/hapijs/hapi/issues/3280
    if (Object.prototype.hasOwnProperty.call(queryParams, 'search')) {
      // If there's a 'search' query param, we ignore the others and search
      // specific fields for that value
      whereParams = {
        [Op.or]: [
          {
            name: {
              [Op.iLike]: '%' + queryParams.search + '%',
            }
          },
          {
            phone: {
              [Op.iLike]: '%' + queryParams.search + '%',
            }
          },
          {
            email: {
              [Op.iLike]: '%' + queryParams.search + '%',
            }
          },
        ]
      };
      landlordOptions.where = whereParams;
      return landlordOptions;
    }
    // else, no 'search' queryParam
    if (Object.prototype.hasOwnProperty.call(queryParams, 'name')) {
      whereParams.name = {
        [Op.iLike]: '%' + queryParams.name + '%',
      };
    }
    if (Object.prototype.hasOwnProperty.call(queryParams, 'phone')) {
      whereParams.phone = {
        [Op.iLike]: '%' + queryParams.phone + '%',
      };
    }
    if (Object.prototype.hasOwnProperty.call(queryParams, 'email')) {
      whereParams.email = {
        [Op.iLike]: '%' + queryParams.email + '%',
      };
    }

    landlordOptions.where = whereParams;
    return landlordOptions;
  }

  function getLandlord(id) {
    return models.Landlord.findByPk(id)
    .then(response => {
      return response;
    })
    .catch(error => {
      return error;
    });
  }

  function getLandlordByMachineName(machineName) {
    return models.Landlord.findOne({
      where: {machineName: machineName}
    });
  }

  function getAllLandlordsByMachineName(machineName) {
    return models.Landlord.findAll({
      where: {machineName: machineName}
    });
  }

  async function createMachineName(name) {
    const space = / /gi; // replaces spaces with -
    const replace = /[/,.()\[\]]/gi; // characters to replace in a machine name
    const remove = /[!?@#$%^&*<>;:|]/gi; // characters to remove from a machine name
    const duplicate = /-+/gi; // duplicate dashes
    const trimming = /^[-]|[-]$/gi // dashes at the beginning or end

    name = name.toLowerCase();
    name = name.replace(space, "-");
    name = name.replace(replace, "-"); // replaces separating chars with a -
    name = name.replace(remove, ""); // removes special chars
    name = name.replace(duplicate, "-"); // de-duplicates dashes
    name = name.replace(trimming, ""); // trims leading and trailing dashes

    let unique = false;
    let counter = 0;
    let machineName = name;
    while(!unique) {
      // TODO: efficiency could be improved with an Op.like lookup
      let propertyExists = await getLandlordByMachineName(machineName);
      if (propertyExists === null) {
        unique = true;
      } else {
        counter ++;
        machineName = name + "-" + counter;
      }
    }

    return machineName;
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

  function getAccountLandlords(accountId) {
    let landlordOptions = {
      where: {
        AuthorId: accountId,
      },
    };
    return models.Landlord.findAll(landlordOptions);
  }

  async function ensureAccount(request) {
    let account;
    try {
      account = await accountLib.getAccount(request.auth.credentials);
    } catch (e) {
      throw Boom.badImplementation('Error during getAccount(request.auth.credentials). ' + e);
    }

    if (account === null) {
      throw Boom.badRequest('Must have an Account');
    }

    return account;
  }

  async function ensureAdmin(request) {
    if (request.auth.credentials.subjectId !== process.env.SUPER_ADMIN) {
      throw Boom.forbidden('Must be an Admin');
    }

    return true;
  }

};

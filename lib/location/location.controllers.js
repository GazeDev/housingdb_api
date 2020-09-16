module.exports = (models) => {
  const Boom = require('@hapi/boom');

  return {
    getLocations: async function(request, h) {
      let response;
      try {
        response = await models.Location.findAll(
          {
            where: {
              LocationId: null,
            },
            include: [
              {
                model: models.Location,
                as: 'children',
                include: [
                  {
                    model: models.Location,
                    as: 'children',
                  },
                ]
              },
            ],
            order: [
              // Sorts Level 2 Locations
              [{ model: models.Location, as: 'children' }, 'name', 'asc'],
              // Sorts Level 3 Locations
              [{ model: models.Location, as: 'children' }, { model: models.Location, as: 'children' }, 'name', 'asc']
            ]
          }
        );
      } catch (e) {
        throw Boom.badImplementation('Error with Location.findAll(...).', e);
      }
      return h.response(response);
    },
    getLocation: async function(request, h) {
      let response;
      try {
        response = await models.Location.findByPk(request.params.id);
      } catch (e) {
        throw Boom.badImplementation('Error with Location.findByPk(request.params.id).', e);
      }
      return h.response(response);
    },
    lib: {
      locationFindCreateNestedTerms: locationFindCreateNestedTerms,
    },
  };

  /*
   * Takes an array of term name strings
   */
  async function locationFindCreateNestedTerms(termNames) {
    let currentId = null;
    let currentTerm = null;
    let createTerm = false; // We start with the assumption we will find terms
    for (let termName of termNames) {
      // If createTerm == True, we want to skip searching the DB
      if (!createTerm) {
        let foundTerm = await locationFindTermByNameAndParent(currentTerm, termName);
        if (foundTerm === null) { // Term does not exist
          createTerm = true;  // Terms will need created from here on out
        }
        else {
          currentTerm = foundTerm;
          currentId = currentTerm.id;
        }
      }
      // This needs to be a separate conditional to catch $create_term when flipped
      if (createTerm) {
        // Term needs to be created
        try {
          currentTerm = await locationCreateTermWithParent(currentTerm, termName);
          currentId = currentTerm.id;
        } catch (e) {
          throw Boom.badImplementation('Error during locationCreateTermWithParent(currentTerm, termName). ' + e);
        }
      }
    }
    return currentId;
  }

  function locationFindTermByNameAndParent(parent, termName) {
    let parentId = null;
    if (parent !== null) {
      parentId = parent.id;
    }
    return models.Location.findOne({
      where: {
        LocationId: parentId,
        name: termName,
      }
    });
  }

  async function locationCreateTermWithParent(parentTerm, termName) {
    let newTerm = await models.Location.create({
      name: termName,
    });
    if (parentTerm === null) {
      return newTerm;
    } else {
      await parentTerm.addChild(newTerm);
      return newTerm;
    }
  }

};

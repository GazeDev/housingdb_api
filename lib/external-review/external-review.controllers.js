module.exports = (models) => {
  const Boom = require('boom');
  const externalReviewModels = require('./external-review.models');
  const accountLib = require('../account/account.controllers')(models).lib;
  const landlordLib = require('../landlord/landlord.controllers')(models).lib;
  const propertyLib = require('../property/property.controllers')(models).lib;

  return {
    getExternalReviewsSchema: function(request, h) {
      const convert = require('joi-to-json-schema');
      return convert(externalReviewModels.api);
    },

    getLandlordExternalReviews: async function(request, h) {
      const landlordId = request.params.id;
      return await getExternalReviews(landlordId, 'landlord')
    },
    getPropertyExternalReviews: async function(request, h) {
      const propertyId = request.params.id;
      return await getExternalReviews(propertyId, 'property')
    },

    postLandlordExternalReview: async function (request, h) {
      let reviewableType = 'landlord';
      let reviewableId = request.params.id;

      let account;
      try {
        account = await accountLib.getAccount(request.auth.credentials);
      } catch (e) {
        throw Boom.badImplementation('Error during getAccount(request.auth.credentials). ' + e);
      }

      if (account === null) {
        throw Boom.badRequest('Must have an Account to create a Review');
      }

      if (process.env.SUPER_ADMIN !== request.auth.credentials.subjectId) {
        throw Boom.badRequest('Must have an Admin Account to create an External Review');
      }

      let reviewableItem;
      try {
        reviewableItem = await getReviewableItem(reviewableType, reviewableId);
      } catch (e) {
        throw Boom.badImplementation('Error during getReviewableItem(reviewableType, reviewableId). ' + e);
      }

      if (reviewableItem === null) {
        throw Boom.badRequest('ReviewableItem does not exist');
      }

      let externalReviewObject = {
        AuthorId: account.id,
        date: request.payload.date,
        url: request.payload.url,
        reviewableType: reviewableType,
        reviewableId: reviewableId,
      };

      let externalReview;
      try {
        externalReview = await createExternalReview(externalReviewObject);
      } catch (e) {
        throw Boom.badImplementation('Error during createExternalReview(externalReviewObject). ' + e);
      }

      let metadata = await reviewableItem.reload().get("metadata");

      let reviewCount = metadata.externalReviewCount;

      if (reviewCount === undefined) {
        reviewCount = 0;
      }

      reviewCount = reviewCount + 1;

      try {
        await reviewableItem.set("metadata.externalReviewCount", reviewCount).save();
      } catch (e) {
        console.log('Error incrementing the metadata.externalReviewCount', e);
      }

      return externalReview;
    },
    postPropertyExternalReview: async function (request, h) {
      let reviewableType = 'property';
      let reviewableId = request.params.id;

      let account;
      try {
        account = await accountLib.getAccount(request.auth.credentials);
      } catch (e) {
        throw Boom.badImplementation('Error during getAccount(request.auth.credentials). ' + e);
      }

      if (account === null) {
        throw Boom.badRequest('Must have an Account to create a Review');
      }

      if (process.env.SUPER_ADMIN !== request.auth.credentials.subjectId) {
        throw Boom.badRequest('Must have an Admin Account to create a Review');
      }

      let reviewableItem;
      try {
        reviewableItem = await getReviewableItem(reviewableType, reviewableId);
      } catch (e) {
        throw Boom.badImplementation('Error during getReviewableItem(reviewableType, reviewableId). ' + e);
      }

      if (reviewableItem === null) {
        throw Boom.badRequest('ReviewableItem does not exist');
      }

      let externalReviewObject = {
        AuthorId: account.id,
        date: request.payload.date,
        url: request.payload.url,
        reviewableType: reviewableType,
        reviewableId: reviewableId,
      };

      let externalReview;
      try {
        externalReview = await createExternalReview(externalReviewObject);
      } catch (e) {
        throw Boom.badImplementation('Error during createExternalReview(externalReviewObject). ' + e);
      }

      let metadata = await reviewableItem.reload().get("metadata");

      let reviewCount = metadata.externalReviewCount;

      if (reviewCount === undefined) {
        reviewCount = 0;
      }

      reviewCount = reviewCount + 1;

      try {
        await reviewableItem.set("metadata.externalReviewCount", reviewCount).save();
      } catch (e) {
        console.log('Error incrementing the metadata.externalReviewCount', e);
      }

      return externalReview;
    },
  };

  function getExternalReviews(reviewableId, reviewableType) {
    return models.ExternalReview.findAll({
      where: {
        reviewableType: reviewableType,
        reviewableId: reviewableId,
      }
    });
  }

  async function getReviewableItem(reviewableType, reviewableId) {
    let getItem;
    if (reviewableType === 'landlord') {
      getItem = landlordLib.getLandlord;
    } else if (reviewableType === 'property') {
      getItem = propertyLib.getProperty;
    } else {
      throw Boom.badRequest('Invalid reviewableType requested');
    }

    let reviewableItem;
    try {
      reviewableItem = await getItem(reviewableId);
    } catch (e) {
      throw Boom.badImplementation('Error during getItem(reviewableId). ' + e);
    }

    return reviewableItem;
  }

  function createExternalReview(externalReviewObject) {
    return models.ExternalReview.create(externalReviewObject)
  }

};

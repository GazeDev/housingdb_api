module.exports = (models) => {
  const Boom = require('boom');
  const externalReviewModels = require('./external-review.models');
  const accountLib = require('../account/account.controllers')(models).lib;

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

      let externalReviewObject = {
        AuthorId: account.id,
        date: request.payload.date,
        link: request.payload.link,
        reviewableType: reviewableType,
        reviewableId: reviewableId,
      };

      let externalReview;
      try {
        externalReview = await createExternalReview(externalReviewObject);
      } catch (e) {
        throw Boom.badImplementation('Error during createExternalReview(reviewObject). ' + e);
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

      let externalReviewObject = {
        AuthorId: account.id,
        date: request.payload.date,
        link: request.payload.link,
        reviewableType: reviewableType,
        reviewableId: reviewableId,
      };

      let externalReview;
      try {
        externalReview = await createExternalReview(externalReviewObject);
      } catch (e) {
        throw Boom.badImplementation('Error during createExternalReview(reviewObject). ' + e);
      }

      return externalReview;
    },
  };

  function getExternalReviews(reviewedItemId) {
    return models.ExternalReview.findAll({
      where: {
        id: reviewedItemId,
      }
    });
  }
  function createExternalReview(externalReviewObject) {
    return models.ExternalReview.create(externalReviewObject)
    .then(response => {
      return response;
    })
    .catch(error => {
      return error;
    });
  }

};

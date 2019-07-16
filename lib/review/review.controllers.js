module.exports = (models) => {
  const Boom = require('boom');
  const reviewModels = require('./review.models');

  return {

    getReviewsSchema: function(request, h) {
      const convert = require('joi-to-json-schema');
      return convert(reviewModels.api);
    },
    getLandlordReviews: async function(request, h) {
      const landlordId = request.params.id;
      return await getReviews(landlordId)
    },
    getLandlordExternalReviews: async function(request, h) {
      const landlordId = request.params.id;
      return await getExternalReviews(landlordId)
    },
    getPropertyReviews: async function(request, h) {
      const propertyId = request.params.id;
      return await getReviews(propertyId)
    },
    getPropertyExternalReviews: async function(request, h) {
      const propertyId = request.params.id;
      return await getExternalReviews(propertyId)
    },
    // postReview: async function (request, h) {
    //
    // },
    postLandlordReview: async function (request, h) {

    },
    postLandlordExternalReview: async function (request, h) {

    },
    postPropertyReview: async function (request, h) {

    },
    postPropertyExternalReview: async function (request, h) {

    },
    deleteReview: function (request, h){
      return models.reviews.destroy({
        where: {
          id: request.params.id,
        },
      })
      .then(response => {
        return h
        .response(response)
        .code(202);
      })
      .catch(error => {
        return error;
      });
    },
  };

  function getReviews(reviewedItemId) {
    return models.Review.findAll({
      where: {
        id: reviewedItemId,
      }
    });
  }
  function getExternalReviews(reviewedItemId) {
    return models.externalReview.findAll({
      where: {
        id: reviewedItemId,
      }
    });
  }

};

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
    getPropertyReviews: async function(request, h) {
      const propertyId = request.params.id;
      return await getReviews(propertyId)
    },
    postReview: async function (request, h) {

    },
    postLandlordReview: async function (request, h) {

    },
    postPropertyReview: async function (request, h) {

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
    return models.reviews.findAll({
      where: {
        id: reviewedItemId,
      }
    });
  }
  
};

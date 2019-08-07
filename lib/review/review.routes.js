module.exports = {
  routes: (models) => {
    const controllers = require('./review.controllers')(models);
    const reviewModels = require('./review.models');
    const landlordModels = require('../landlord/landlord.models');
    const propertyModels = require('../property/property.models');
    return [

      {
        method: 'GET',
        path: '/reviews/schema',
        config: {
          handler: controllers.getReviewsSchema,
          description: 'Get reviews schema',
          notes: 'Returns the json schema for a review.',
          tags: ['api', 'Reviews'],
        }
      },
      {
        method: 'GET',
        path: '/landlords/{id}/reviews',
        handler: controllers.getLandlordReviews,
        config: {
          description: 'Get Landlord reviews by Id',
          notes: 'Returns one landlord.',
          tags: ['api', 'Landlords', 'Reviews'],
          validate: {
            params: landlordModels.id,
          }
        }
      },
      {
        method: 'POST',
        path: '/landlords/{id}/reviews',
        config: {
          auth: 'jwt',
          handler: controllers.postLandlordReview,
          description: 'Create Review For Landlord',
          notes: 'Create a review in the database.',
          tags: ['api', 'Reviews', 'Landlords'],
          validate: {
            params: landlordModels.id,
            payload: reviewModels.api,
          }
        }
      },
      {
        method: 'GET',
        path: '/properties/{id}/reviews',
        handler: controllers.getPropertyReviews,
        config: {
          description: 'Get Property by Id',
          notes: 'Returns one property.',
          tags: ['api', 'Properties', 'Reviews'],
          validate: {
            params: propertyModels.id,
          }
        }
      },
      {
        method: 'POST',
        path: '/properties/{id}/reviews',
        config: {
          auth: 'jwt',
          handler: controllers.postPropertyReview,
          description: 'Create Review For Property',
          notes: 'Create a review in the database.',
          tags: ['api', 'Reviews', 'Properties'],
          validate: {
            params: propertyModels.id,
            payload: reviewModels.api,
          }
        }
      },
      {
        method: 'GET',
        path: '/reviews',
        config: {
          auth: 'jwt',
          handler: controllers.getReviews,
          description: 'Get Own Reviews',
          notes: 'Get the Reviews for the currently authd user from the database.',
          tags: ['api', 'Reviews'],
        }
      },
      {
        method: 'DELETE',
        path: '/reviews/{id}',
        config: {
          auth: 'jwt',
          handler: controllers.deleteReview,
          description: 'Delete Review',
          notes: 'Deletes a review from the database.',
          tags: ['api', 'Reviews'],
          validate: {
            params: reviewModels.id,
          }
        }
      },


    ];
  },
};

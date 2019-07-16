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
        method: 'GET',
        path: '/landlords/{id}/external-reviews',
        handler: controllers.getLandlordExternalReviews,
        config: {
          description: 'Get Landlord external reviews by Id',
          notes: 'Returns one landlord.',
          tags: ['api', 'Landlords', 'Reviews'],
          validate: {
            params: landlordModels.id,
          }
        }
      },
      {
        method: 'GET',
        path: '/properties/{id}/reviews',
        handler: controllers.getPropertyReviews,
        config: {
          description: 'Get Property reviews by Id',
          notes: 'Returns one property.',
          tags: ['api', 'Properties', 'Reviews'],
          validate: {
            params: propertyModels.id,
          }
        }
      },
      {
        method: 'GET',
        path: '/properties/{id}/external-reviews',
        handler: controllers.getPropertyExternalReviews,
        config: {
          description: 'Get Property external reviews by Id',
          notes: 'Returns one property.',
          tags: ['api', 'Properties', 'Reviews'],
          validate: {
            params: propertyModels.id,
          }
        }
      },
      // {
      //   method: 'POST',
      //   path: '/reviews',
      //   config: {
      //     handler: controllers.postReview,
      //     description: 'Create Review',
      //     notes: 'Create a review in the database.',
      //     tags: ['api', 'Reviews'],
      //     validate: {
      //       payload: reviewModels.api,
      //     }
      //   }
      // },
      {
        method: 'POST',
        path: '/landlords/{id}/reviews',
        config: {
          handler: controllers.postLandlordReview,
          description: 'Create Review For Landlord',
          notes: 'Create a review in the database.',
          tags: ['api', 'Reviews', 'Properties'],
          validate: {
            payload: reviewModels.api,
          }
        }
      },
      {
        method: 'POST',
        path: '/landlords/{id}/external-reviews',
        config: {
          handler: controllers.postLandlordExternalReview,
          description: 'Create External Review For Landlord',
          notes: 'Create an external review in the database.',
          tags: ['api', 'Reviews', 'Properties'],
          validate: {
            payload: reviewModels.api,
          }
        }
      },
      {
        method: 'POST',
        path: '/properties/{id}/reviews',
        config: {
          handler: controllers.postPropertyReview,
          description: 'Create Review For Property',
          notes: 'Create a review in the database.',
          tags: ['api', 'Reviews', 'Properties'],
          validate: {
            payload: reviewModels.api,
          }
        }
      },
      {
        method: 'POST',
        path: '/properties/{id}/external-reviews',
        config: {
          handler: controllers.postPropertyExternalReview,
          description: 'Create External Review For Property',
          notes: 'Create an external review in the database.',
          tags: ['api', 'Reviews', 'Properties'],
          validate: {
            payload: reviewModels.api,
          }
        }
      },
      {
        method: 'DELETE',
        path: '/reviews/{id}',
        config: {
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

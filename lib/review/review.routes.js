module.exports = {
  routes: (models) => {
    const controllers = require('./review.controllers')(models);
    const reviewModels = require('./review.models');
    const landlordModels = require('../landlord/landlord.models');
    const propertyModels = require('../property/property.models');
    return [
      {
        method: 'GET',
        path: '/landlords/{id}/reviews',
        handler: controllers.getLandlordReviews,
        options: {
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
        options: {
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
      // {
      //   method: 'POST',
      //   path: '/reviews',
      //   options: {
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
        method: 'GET',
        path: '/properties/{id}/reviews',
        handler: controllers.getPropertyReviews,
        options: {
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
        options: {
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
        path: '/accounts/reviews',
        options: {
          auth: 'jwt',
          handler: controllers.getReviews,
          description: 'Get Own Reviews',
          notes: 'Get the Reviews for the currently authd user from the database.',
          tags: ['api', 'Accounts', 'Reviews'],
        }
      },
      {
        method: 'DELETE',
        path: '/reviews/{id}',
        options: {
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

module.exports = {
  routes: (models) => {
    const controllers = require('./review.controllers')(models);
    const reviewModels = require('./review.models');
    return [


      {
        method: 'GET',
        path: '/reviews',
        handler: controllers.getReviews,
        config: {
          description: 'Get Reviews',
          notes: 'Returns all Reviews.',
          tags: ['api', 'Reviews'],
        }
      },
      {
        method: 'GET',
        path: '/Reviews/{id}',
        handler: controllers.getReview,
        config: {
          description: 'Get Review by Id',
          notes: 'Returns one review.',
          tags: ['api', 'Reviews'],
          validate: {
            params: reviewModels.id,
          }
        }
      },
      {
        method: 'GET',
        path: '/Reviews/schema',
        config: {
          handler: controllers.getReviewsSchema,
          description: 'Get Reviews Schema',
          notes: 'Returns the json schema for a review.',
          tags: ['api', 'Reviews'],
        }
      },
      {
        method: 'POST',
        path: '/Reviews',
        config: {
          handler: controllers.postReview,
          description: 'Create Review',
          notes: 'Create a review in the database.',
          tags: ['api', 'Reviews'],
          validate: {
            payload: reviewModels.api,
          }
        }
      },
      {
        method: 'DELETE',
        path: '/Reviews/{id}',
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

module.exports = {
  routes: (models) => {
    const controllers = require('./external-review.controllers')(models);
    const externalReviewModels = require('./external-review.models');
    const landlordModels = require('../landlord/landlord.models');
    const propertyModels = require('../property/property.models');
    return [

      {
        method: 'GET',
        path: '/external-reviews/schema',
        config: {
          handler: controllers.getExternalReviewsSchema,
          description: 'Get external reviews schema',
          notes: 'Returns the json schema for an external review.',
          tags: ['api', 'External Reviews'],
        }
      },
      {
        method: 'GET',
        path: '/landlords/{id}/external-reviews',
        handler: controllers.getLandlordExternalReviews,
        config: {
          description: 'Get Landlord external reviews by Id',
          notes: 'Returns one landlord.',
          tags: ['api', 'Landlords', 'External Reviews'],
          validate: {
            params: landlordModels.id,
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
          tags: ['api', 'Properties', 'External Reviews'],
          validate: {
            params: propertyModels.id,
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
          tags: ['api', 'External Reviews', 'Landlords'],
          validate: {
            params: landlordModels.id,
            payload: externalReviewModels.api,
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
          tags: ['api', 'External Reviews', 'Properties'],
          validate: {
            params: propertyModels.id,
            payload: externalReviewModels.api,
          }
        }
      },
    ];
  },
};

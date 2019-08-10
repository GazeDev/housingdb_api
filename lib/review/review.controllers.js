module.exports = (models) => {
  const Boom = require('boom');
  const reviewModels = require('./review.models');
  const accountLib = require('../account/account.controllers')(models).lib;

  return {

    getReviewsSchema: function(request, h) {
      const convert = require('joi-to-json-schema');
      return convert(reviewModels.api);
    },
    getReviews: async function(request, h) {
      let account;
      try {
        account = await accountLib.getAccount(request.auth.credentials);
      } catch (e) {
        throw Boom.badImplementation('Error during getAccount(request.auth.credentials). ' + e);
      }

      if (account === null) {
        throw Boom.badRequest('Must have an Account to create a Review');
      }

      return await getAccountReviews(account.id);
    },
    getLandlordReviews: async function(request, h) {
      const landlordId = request.params.id;
      return await getItemReviews(landlordId, 'landlord');
    },
    getPropertyReviews: async function(request, h) {
      const propertyId = request.params.id;
      return await getItemReviews(propertyId, 'property');
    },
    // postReview: async function (request, h) {
    //
    // },
    postLandlordReview: async function (request, h) {
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

      let existingReview;
      try {
        existingReview = await getOneAccountItemReview(
          account.id,
          reviewableId,
          reviewableType,
        );
      } catch (e) {
        throw Boom.badImplementation('Error during getOneAccountItemReview(...). ' + e);
      }

      if (existingReview !== null) {
        throw Boom.badRequest('This Account has already created a Review for this Item');
      }

      let reviewObject = {
        AuthorId: account.id,
        subject: request.payload.subject,
        body: request.payload.body,
        rating: request.payload.rating,
        reviewableType: reviewableType,
        reviewableId: reviewableId,
      };

      let review;
      try {
        review = await createReview(reviewObject);
      } catch (e) {
        throw Boom.badImplementation('Error during createReview(reviewObject). ' + e);
      }

      return review;
    },
    postPropertyReview: async function (request, h) {
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

      let existingReview;
      try {
        existingReview = await getOneAccountItemReview(
          account.id,
          reviewableId,
          reviewableType
        );
      } catch (e) {
        throw Boom.badImplementation('Error during getAccountItemsReviews(...). ' + e);
      }

      if (existingReview !== null) {
        throw Boom.badRequest('This Account has already created a Review for this Item');
      }

      let reviewObject = {
        AuthorId: account.id,
        subject: request.payload.subject,
        body: request.payload.body,
        rating: request.payload.rating,
        reviewableType: reviewableType,
        reviewableId: reviewableId,
      };

      let review;
      try {
        review = await createReview(reviewObject);
      } catch (e) {
        throw Boom.badImplementation('Error during createReview(reviewObject). ' + e);
      }

      return review;
    },
    deleteReview: function (request, h) {
      // TODO: When this is implemented, only the author of the review should
      // be able to delete it. Or an admin.

      // return models.reviews.destroy({
      //   where: {
      //     id: request.params.id,
      //   },
      // });
      // .then(response => {
      //   return h
      //   .response(response)
      //   .code(202);
      // })
      // .catch(error => {
      //   return error;
      // });
    },
  };

  function getReviewOptions() {
    return {
      attributes: { exclude: ['AuthorId'] },
    }
  }

  function getItemReviews(reviewableId, reviewableType) {
    // combine our local query object with getReviewOptions object
    let reviewOptions = {
      ...{
        where: {
          reviewableType: reviewableType,
          reviewableId: reviewableId,
        },
      },
      ...getReviewOptions()
    };
    return models.Review.findAll(reviewOptions);
  }

  function getAccountReviews(accountId) {
    // combine our local query object with getReviewOptions object
    let reviewOptions = {
      ...{
        where: {
          AuthorId: accountId,
        },
      },
      ...getReviewOptions()
    };
    return models.Review.findAll(reviewOptions);
  }

  function getOneAccountItemReview(accountId, reviewableId, reviewableType) {
    // combine our local query object with getReviewOptions object
    let reviewOptions = {
      ...{
        where: {
          AuthorId: accountId,
          reviewableType: reviewableType,
          reviewableId: reviewableId,
        },
      },
      ...getReviewOptions()
    };
    return models.Review.findOne(reviewOptions);
  }

  function createReview(reviewObject) {
    return models.Review.create(reviewObject)
    .then(response => {
      return response;
    })
    .catch(error => {
      return error;
    });
  }

};

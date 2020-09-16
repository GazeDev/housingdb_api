module.exports = (models) => {
  const Boom = require('@hapi/boom');
  const reviewModels = require('./review.models');
  const accountLib = require('../account/account.controllers')(models).lib;
  const landlordLib = require('../landlord/landlord.controllers')(models).lib;
  const propertyLib = require('../property/property.controllers')(models).lib;


  return {
    getReviews: async function(request, h) {
      let account = request.pre.account;

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

      let account = request.pre.account;

      let reviewableItem;
      try {
        reviewableItem = await getReviewableItem(reviewableType, reviewableId);
      } catch (e) {
        throw Boom.badImplementation('Error during getReviewableItem(reviewableType, reviewableId). ' + e);
      }

      if (reviewableItem === null) {
        throw Boom.badRequest('ReviewableItem does not exist');
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
      await reviewableItem.reload();
      let metadata = await reviewableItem.get('metadata');

      let reviewCount = metadata.reviewCount;

      if (reviewCount === undefined) {
        reviewCount = 0;
      }

      let reviewAverage = metadata.reviewAverage;

      if (reviewAverage === undefined) {
        reviewAverage = 0;
      }

      let reviewWeight = reviewAverage * reviewCount;

      reviewWeight = reviewWeight + reviewObject.rating;

      reviewCount = reviewCount + 1;

      reviewAverage = reviewWeight / reviewCount;

      try {
        await reviewableItem.set('metadata.reviewCount', reviewCount).save();
        await reviewableItem.set('metadata.reviewAverage', reviewAverage).save();
      } catch (e) {
        console.log('Error incrementing the metadata.reviewCount or metadata.reviewAverage', e);
      }

      return review;
    },
    postPropertyReview: async function (request, h) {
      let reviewableType = 'property';
      let reviewableId = request.params.id;

      let account = request.pre.account;

      let reviewableItem;
      try {
        reviewableItem = await getReviewableItem(reviewableType, reviewableId);
      } catch (e) {
        throw Boom.badImplementation('Error during getReviewableItem(reviewableType, reviewableId). ' + e);
      }

      if (reviewableItem === null) {
        throw Boom.badRequest('ReviewableItem does not exist');
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

      await reviewableItem.reload();
      let metadata = await reviewableItem.get('metadata');

      let reviewCount = metadata.reviewCount;

      if (reviewCount === undefined) {
        reviewCount = 0;
      }

      let reviewAverage = metadata.reviewAverage;

      if (reviewAverage === undefined) {
        reviewAverage = 0;
      }

      let reviewWeight = reviewAverage * reviewCount;

      reviewWeight = reviewWeight + reviewObject.rating;

      reviewCount = reviewCount + 1;

      reviewAverage = reviewWeight / reviewCount;

      try {
        await reviewableItem.set('metadata.reviewCount', reviewCount).save();
        await reviewableItem.set('metadata.reviewAverage', reviewAverage).save();
      } catch (e) {
        console.log('Error incrementing the metadata.reviewCount or metadata.reviewAverage', e);
      }

      return review;
    },
    deleteReview: async function (request, h) {
      // TODO: When this is implemented, only the author of the review should
      // be able to delete it. Or an admin.
      // let response;
      // try {
      //   response = await models.reviews.destroy({
      //     where: {
      //       id: request.params.id,
      //     },
      //   });
      // } catch (e) {
      //   throw Boom.badImplementation('Error during models.reviews.destroy(...);.', e);
      // }
      // return h
      //   .response(response)
      //   .code(202);
    },
  };

  function getReviewOptions() {
    return {
      attributes: { exclude: ['AuthorId'] },
    }
  }

  function getItemReviews(reviewableId, reviewableType) {
    // combine our local query object with getReviewOptions object
    let reviewOptions = getReviewOptions();
    if (reviewOptions.where === undefined) {
      reviewOptions.where = {};
    }
    reviewOptions.where.reviewableType = reviewableType;
    reviewOptions.where.reviewableId = reviewableId;
    return models.Review.findAll(reviewOptions);
  }

  function getAccountReviews(accountId) {
    // combine our local query object with getReviewOptions object
    let reviewOptions = getReviewOptions();
    if (reviewOptions.where === undefined) {
      reviewOptions.where = {};
    }
    reviewOptions.where.AuthorId = accountId;
    return models.Review.findAll(reviewOptions);
  }

  function getOneAccountItemReview(accountId, reviewableId, reviewableType) {
    // combine our local query object with getReviewOptions object
    let reviewOptions = getReviewOptions();
    if (reviewOptions.where === undefined) {
      reviewOptions.where = {};
    }
    reviewOptions.where.AuthorId = accountId;
    reviewOptions.where.reviewableType = reviewableType;
    reviewOptions.where.reviewableId = reviewableId;
    return models.Review.findOne(reviewOptions);
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

  function createReview(reviewObject) {
    return models.Review.create(reviewObject)
  }

};

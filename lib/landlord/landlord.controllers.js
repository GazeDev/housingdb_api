// TODO: figure out if we can put landlord stuff in here due to dependency tree
// const landlordLib = require('../landlord/landlord.controllers')(models).lib;

// Landlord section
// if (request.payload.landlordId) {
//   const landlordIdValid = landlordLib.getLandlord(request.payload.landlordId);
//   console.log(landlordIdValid);
//   if (landlordIdValid) {
//     propertyObject.landlordId = request.payload.landlordId;
//   }
// } else if (request.payload.landlord) {
//   const landlordLookup = await landlordLib.lookupLandlordFromText(request.payload.landlord);
//   if (landlordLookup) {
//     propertyObject.landlordId = landlordLookup.id;
//   } else {
//     let landlordCreate = await landlordLib.createLandlordFromText(request.payload.landlord);
//     propertyObject.landlordId = landlordCreate.id;
//   }
// }

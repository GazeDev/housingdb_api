const Joi = require('joi');

module.exports = {
  db: (sequelize, Sequelize) => {
    const Location = sequelize.define('Location', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      // parentId: Sequelize.UUID,
      name: Sequelize.STRING,
      body: Sequelize.TEXT,
    });

    Location.associate = function (models) {
      // TODO: try using an association to Location for the parentId field. not sure if self referencing is OK
      // models.Location.belongsTo(models.Location, {as: 'parent'});
      models.Location.hasMany(models.Location, {as: {
        singular: 'child',
        plural: 'children'
      }});
    };

    return Location;
  },
  id: Joi.object().keys({
    id: Joi.string().guid().required(),
  }),
};

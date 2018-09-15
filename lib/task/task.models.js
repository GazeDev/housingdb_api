const Joi = require('joi');

module.exports = {
  db: (sequelize, Sequelize) => {
    const Task = sequelize.define('Task', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: Sequelize.STRING
    });

    Task.associate = function (models) {
      models.Task.belongsTo(models.User, {
        onDelete: "CASCADE",
        foreignKey: {
          allowNull: false
        }
      });
    };

    return Task;
  },
  id: Joi.object().keys({
      id: Joi.string().guid()
  }),
  api: Joi.object().keys({
      title: Joi.string().required(),
  })
};

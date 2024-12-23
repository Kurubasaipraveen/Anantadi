'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Video extends Model {
    static associate(models) {
      Video.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }

  Video.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.STRING },
      tags: { type: DataTypes.STRING },
      fileSize: { type: DataTypes.INTEGER },
      uploadDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: 'Video',
    }
  );

  return Video;
};

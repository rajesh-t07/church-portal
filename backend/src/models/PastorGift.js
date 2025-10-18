const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PastorGift = sequelize.define('PastorGift', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    weekDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Week start date (Sunday)'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Amount given to pastor as gift'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Optional notes about the pastor gift'
    },
    enteredBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  });

  PastorGift.associate = (models) => {
    PastorGift.belongsTo(models.User, { 
      foreignKey: 'enteredBy',
      as: 'EnteredBy'
    });
  };

  return PastorGift;
};
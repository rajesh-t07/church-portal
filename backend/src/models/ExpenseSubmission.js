const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ExpenseSubmission = sequelize.define('ExpenseSubmission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    submissionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    approvedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reimbursementReceiptUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  ExpenseSubmission.associate = (models) => {
    ExpenseSubmission.belongsTo(models.User, { 
      foreignKey: 'userId',
      as: 'User'
    });
    ExpenseSubmission.belongsTo(models.User, { 
      foreignKey: 'approvedBy',
      as: 'ApprovedBy'
    });
    ExpenseSubmission.hasMany(models.Expense, {
      foreignKey: 'submissionId',
      as: 'Expenses'
    });
  };

  return ExpenseSubmission;
};
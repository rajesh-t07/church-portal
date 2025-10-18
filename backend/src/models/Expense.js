const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Expense = sequelize.define('Expense', {
    id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    userId: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    submissionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'ExpenseSubmissions',
        key: 'id'
      }
    },
    amount: { 
      type: DataTypes.DECIMAL(10, 2), 
      allowNull: false 
    },
    description: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    category: { 
      type: DataTypes.STRING, 
      defaultValue: 'General' 
    },
    receiptUrls: { 
      type: DataTypes.JSON 
    },
    status: { 
      type: DataTypes.ENUM('pending', 'approved', 'rejected'), 
      defaultValue: 'pending' 
    },
    submissionDate: { 
      type: DataTypes.DATE, 
      defaultValue: DataTypes.NOW 
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
      type: DataTypes.DATE 
    },
    reimbursementReceiptUrl: { 
      type: DataTypes.STRING 
    },
    notes: { 
      type: DataTypes.TEXT 
    }
  });

  Expense.associate = (models) => {
    Expense.belongsTo(models.User, { 
      foreignKey: 'userId',
      as: 'User'
    });
    Expense.belongsTo(models.User, { 
      foreignKey: 'approvedBy',
      as: 'ApprovedBy'
    });
    Expense.belongsTo(models.ExpenseSubmission, {
      foreignKey: 'submissionId',
      as: 'Submission'
    });
  };

  return Expense;
};

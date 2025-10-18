const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Reimbursement', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    receiptUrl: { type: DataTypes.STRING },
    reimbursedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  });
};

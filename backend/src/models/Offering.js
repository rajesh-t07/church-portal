const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Offering', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    date: { type: DataTypes.DATE, allowNull: false },
    checks: { type: DataTypes.JSON },
    cash: { type: DataTypes.JSON },
    individualCashDonations: { type: DataTypes.JSON },
    total: { type: DataTypes.FLOAT },
    pastorGift: { type: DataTypes.FLOAT, defaultValue: 0 },
    finalDeposit: { type: DataTypes.FLOAT },
    cashTotal: { type: DataTypes.FLOAT },
    checksTotal: { type: DataTypes.FLOAT },
    status: { type: DataTypes.STRING, defaultValue: 'pending' },
    depositSlipUrl: { type: DataTypes.STRING },
    bankDepositSlipUrl: { type: DataTypes.STRING },
    reviewer1: { type: DataTypes.STRING },
    reviewer2: { type: DataTypes.STRING },
    sessionId: { type: DataTypes.INTEGER }, // Link to DonationSession
    submittedBy: { type: DataTypes.INTEGER },
    submittedAt: { type: DataTypes.DATE },
    updatedBy: { type: DataTypes.INTEGER },
    updatedAt: { type: DataTypes.DATE }
  });
};

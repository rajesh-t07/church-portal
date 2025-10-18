const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  const Donation = sequelize.define('Donation', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    sessionId: { 
      type: DataTypes.INTEGER, 
      allowNull: true,
      references: {
        model: 'DonationSessions',
        key: 'id'
      },
      comment: 'Links to the donation session this donation belongs to'
    },
    donorId: { 
      type: DataTypes.INTEGER, 
      allowNull: true,
      references: {
        model: 'Donors',
        key: 'id'
      }
    },
    donorName: { type: DataTypes.STRING, allowNull: false },
    donorAddress: { type: DataTypes.TEXT },
    donorEmail: { type: DataTypes.STRING },
    donorPhone: { type: DataTypes.STRING },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    donationType: { type: DataTypes.STRING, defaultValue: 'Tithe' }, // Tithe, Offering, Building Fund, etc.
    paymentMethod: { type: DataTypes.STRING }, // Check, Cash, Online
    checkNumber: { type: DataTypes.STRING },
    donationDate: { type: DataTypes.DATE, allowNull: false },
    enteredBy: { type: DataTypes.INTEGER, allowNull: false },
    enteredDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    notes: { type: DataTypes.TEXT }
  });

  Donation.associate = (models) => {
    Donation.belongsTo(models.Donor, {
      foreignKey: 'donorId',
      as: 'Donor'
    });
    Donation.belongsTo(models.User, {
      foreignKey: 'enteredBy',
      as: 'EnteredBy'
    });
    Donation.belongsTo(models.DonationSession, {
      foreignKey: 'sessionId',
      as: 'Session'
    });
  };

  return Donation;
};
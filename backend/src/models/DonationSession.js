const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DonationSession = sequelize.define('DonationSession', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    sessionDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    totalDonations: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: 'Total amount collected from all donations'
    },
    cashAmount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: 'Total cash donations'
    },
    checkAmount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: 'Total check donations'
    },
    pastorGift: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: 'Amount given as pastor gift'
    },
    netDeposit: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: 'Amount actually deposited (totalDonations - pastorGift)'
    },
    donationCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of individual donations in this session'
    },
    enteredBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      comment: 'User who recorded this session'
    },
    reviewer1: {
      type: DataTypes.STRING,
      comment: 'Name of first person who reviewed/counted offerings'
    },
    reviewer2: {
      type: DataTypes.STRING,
      comment: 'Name of second person who reviewed/counted offerings'
    },
    notes: {
      type: DataTypes.TEXT,
      comment: 'Session notes or special circumstances'
    }
  });

  DonationSession.associate = (models) => {
    // Session belongs to the user who entered it
    DonationSession.belongsTo(models.User, {
      foreignKey: 'enteredBy',
      as: 'EnteredBy'
    });

    // Session has many donations
    DonationSession.hasMany(models.Donation, {
      foreignKey: 'sessionId',
      as: 'Donations'
    });
  };

  return DonationSession;
};
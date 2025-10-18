// Migration: Add DonationSessions table and sessionId to Donations
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create DonationSessions table
    await queryInterface.createTable('DonationSessions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      sessionDate: { type: Sequelize.DATE, allowNull: false },
      totalDonations: { type: Sequelize.FLOAT, allowNull: false },
      cashAmount: { type: Sequelize.FLOAT, defaultValue: 0 },
      checkAmount: { type: Sequelize.FLOAT, defaultValue: 0 },
      pastorGift: { type: Sequelize.FLOAT, defaultValue: 0 },
      netDeposit: { type: Sequelize.FLOAT, allowNull: false },
      donationCount: { type: Sequelize.INTEGER, defaultValue: 0 },
      enteredBy: { type: Sequelize.INTEGER },
      notes: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    // Add sessionId to Donations
    await queryInterface.addColumn('Donations', 'sessionId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'DonationSessions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Donations', 'sessionId');
    await queryInterface.dropTable('DonationSessions');
  }
};

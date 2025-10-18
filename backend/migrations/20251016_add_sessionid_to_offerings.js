const { QueryInterface, DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add sessionId column to Offerings table
    await queryInterface.addColumn('Offerings', 'sessionId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'DonationSessions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove sessionId column from Offerings table
    await queryInterface.removeColumn('Offerings', 'sessionId');
  }
};
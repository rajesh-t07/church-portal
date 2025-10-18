const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add missing columns to Offerings table
    const tableInfo = await queryInterface.describeTable('Offerings');
    
    if (!tableInfo.pastorGift) {
      await queryInterface.addColumn('Offerings', 'pastorGift', {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        allowNull: true
      });
    }
    
    if (!tableInfo.finalDeposit) {
      await queryInterface.addColumn('Offerings', 'finalDeposit', {
        type: DataTypes.FLOAT,
        allowNull: true
      });
    }
    
    if (!tableInfo.cashTotal) {
      await queryInterface.addColumn('Offerings', 'cashTotal', {
        type: DataTypes.FLOAT,
        allowNull: true
      });
    }
    
    if (!tableInfo.checksTotal) {
      await queryInterface.addColumn('Offerings', 'checksTotal', {
        type: DataTypes.FLOAT,
        allowNull: true
      });
    }
    
    if (!tableInfo.bankDepositSlipUrl) {
      await queryInterface.addColumn('Offerings', 'bankDepositSlipUrl', {
        type: DataTypes.STRING,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Offerings', 'pastorGift');
    await queryInterface.removeColumn('Offerings', 'finalDeposit');
    await queryInterface.removeColumn('Offerings', 'cashTotal');
    await queryInterface.removeColumn('Offerings', 'checksTotal');
    await queryInterface.removeColumn('Offerings', 'bankDepositSlipUrl');
  }
};
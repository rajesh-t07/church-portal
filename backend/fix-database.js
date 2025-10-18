require('dotenv').config();
const { QueryInterface, Sequelize } = require('sequelize');
const { sequelize } = require('./src/models');

async function addMissingColumns() {
  console.log('🔧 Fixing database schema...');
  
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    // Check if pastorGift column exists
    const tableDescription = await queryInterface.describeTable('Offerings');
    
    if (!tableDescription.pastorGift) {
      console.log('Adding pastorGift column...');
      await queryInterface.addColumn('Offerings', 'pastorGift', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
      });
    }
    
    if (!tableDescription.finalDeposit) {
      console.log('Adding finalDeposit column...');
      await queryInterface.addColumn('Offerings', 'finalDeposit', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      });
    }
    
    if (!tableDescription.cashTotal) {
      console.log('Adding cashTotal column...');
      await queryInterface.addColumn('Offerings', 'cashTotal', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      });
    }
    
    if (!tableDescription.checksTotal) {
      console.log('Adding checksTotal column...');
      await queryInterface.addColumn('Offerings', 'checksTotal', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      });
    }
    
    if (!tableDescription.depositSlipUrl) {
      console.log('Adding depositSlipUrl column...');
      await queryInterface.addColumn('Offerings', 'depositSlipUrl', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    
    if (!tableDescription.bankDepositSlipUrl) {
      console.log('Adding bankDepositSlipUrl column...');
      await queryInterface.addColumn('Offerings', 'bankDepositSlipUrl', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    
    if (!tableDescription.status) {
      console.log('Adding status column...');
      await queryInterface.addColumn('Offerings', 'status', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'Offerings Entered - Pending Deposit'
      });
    }
    
    if (!tableDescription.submittedBy) {
      console.log('Adding submittedBy column...');
      await queryInterface.addColumn('Offerings', 'submittedBy', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    
    if (!tableDescription.submittedAt) {
      console.log('Adding submittedAt column...');
      await queryInterface.addColumn('Offerings', 'submittedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
    
    if (!tableDescription.updatedBy) {
      console.log('Adding updatedBy column...');
      await queryInterface.addColumn('Offerings', 'updatedBy', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    
    console.log('✅ Database schema updated successfully!');
    console.log('🔄 You can now restart your backend server.');
    
  } catch (error) {
    console.error('❌ Error updating database:', error);
  } finally {
    await sequelize.close();
  }
}

addMissingColumns();
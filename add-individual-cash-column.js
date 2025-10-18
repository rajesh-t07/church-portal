const { Sequelize } = require('sequelize');
const path = require('path');

// Database configuration
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'backend', 'src', 'utils', 'database.sqlite'),
  logging: console.log
});

async function addIndividualCashColumn() {
  try {
    console.log('🔄 Adding individualCashDonations column to offerings table...');
    
    // Add the new column
    await sequelize.query(`
      ALTER TABLE offerings 
      ADD COLUMN individualCashDonations TEXT;
    `);
    
    console.log('✅ Successfully added individualCashDonations column!');
    
    // Verify the column was added
    const [results] = await sequelize.query(`
      PRAGMA table_info(offerings);
    `);
    
    console.log('\n📋 Current offerings table structure:');
    results.forEach(column => {
      console.log(`  - ${column.name}: ${column.type}`);
    });
    
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️  Column already exists, skipping...');
    } else {
      console.error('❌ Error adding column:', error.message);
    }
  } finally {
    await sequelize.close();
    console.log('\n🔚 Migration script completed.');
  }
}

// Run the migration
addIndividualCashColumn();
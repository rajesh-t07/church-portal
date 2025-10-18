const { sequelize } = require('./src/models');

async function updateOfferingsTable() {
  try {
    console.log('Updating Offerings table schema...');
    
    // Check current table structure
    const [results] = await sequelize.query("PRAGMA table_info(Offerings)");
    console.log('Current table structure:', results.map(r => r.name));
    
    // Add missing columns
    const columnsToAdd = [
      { name: 'pastorGift', type: 'REAL DEFAULT 0' },
      { name: 'finalDeposit', type: 'REAL' },
      { name: 'cashTotal', type: 'REAL' },
      { name: 'checksTotal', type: 'REAL' },
      { name: 'bankDepositSlipUrl', type: 'TEXT' }
    ];
    
    for (const column of columnsToAdd) {
      try {
        await sequelize.query(`ALTER TABLE Offerings ADD COLUMN ${column.name} ${column.type}`);
        console.log(`✅ Added column: ${column.name}`);
      } catch (error) {
        if (error.message.includes('duplicate column name')) {
          console.log(`⚠️ Column ${column.name} already exists`);
        } else {
          console.error(`❌ Error adding column ${column.name}:`, error.message);
        }
      }
    }
    
    // Verify final structure
    const [finalResults] = await sequelize.query("PRAGMA table_info(Offerings)");
    console.log('Updated table structure:', finalResults.map(r => r.name));
    
    console.log('✅ Database schema update completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error updating database schema:', error);
    process.exit(1);
  }
}

updateOfferingsTable();
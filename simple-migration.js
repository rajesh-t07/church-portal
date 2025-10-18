const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to your database
const dbPath = path.join(__dirname, 'backend', 'src', 'utils', 'database.sqlite');

console.log('🔄 Adding individualCashDonations column to offerings table...');
console.log('Database path:', dbPath);

// Open database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    return;
  }
  console.log('✅ Connected to the SQLite database.');
});

// Add the column
db.run(`ALTER TABLE offerings ADD COLUMN individualCashDonations TEXT;`, function(err) {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('ℹ️  Column already exists, skipping...');
    } else {
      console.error('❌ Error adding column:', err.message);
    }
  } else {
    console.log('✅ Successfully added individualCashDonations column!');
  }
  
  // Verify the column was added
  db.all(`PRAGMA table_info(offerings);`, (err, rows) => {
    if (err) {
      console.error('❌ Error getting table info:', err.message);
    } else {
      console.log('\n📋 Current offerings table structure:');
      rows.forEach(column => {
        console.log(`  - ${column.name}: ${column.type}`);
      });
    }
    
    // Close database
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('\n🔚 Migration script completed.');
      }
    });
  });
});
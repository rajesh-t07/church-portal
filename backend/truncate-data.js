const { User, Donor, DonationSession, Donation, Offering, Expense, ExpenseSubmission, Reimbursement, PastorGift } = require('./src/models');
const { sequelize } = require('./src/models');

async function truncateAllTables() {
  console.log('🗑️ Truncating all tables...');
  
  try {
    // Disable foreign key checks
    await sequelize.query('PRAGMA foreign_keys = OFF');
    
    // Truncate all tables in dependency order
    console.log('   Clearing Donations...');
    await Donation.destroy({ where: {}, force: true });
    
    console.log('   Clearing DonationSessions...');
    await DonationSession.destroy({ where: {}, force: true });
    
    console.log('   Clearing Offerings...');
    await Offering.destroy({ where: {}, force: true });
    
    console.log('   Clearing Expenses...');
    await Expense.destroy({ where: {}, force: true });
    
    console.log('   Clearing ExpenseSubmissions...');
    await ExpenseSubmission.destroy({ where: {}, force: true });
    
    console.log('   Clearing Reimbursements...');
    await Reimbursement.destroy({ where: {}, force: true });
    
    console.log('   Clearing PastorGifts...');
    await PastorGift.destroy({ where: {}, force: true });
    
    console.log('   Clearing Donors...');
    await Donor.destroy({ where: {}, force: true });
    
    console.log('   Clearing Member Users...');
    await User.destroy({ where: { role: 'member' }, force: true });
    
    // Re-enable foreign key checks
    await sequelize.query('PRAGMA foreign_keys = ON');
    
    console.log('✅ All tables truncated successfully');
    console.log('🔐 Admin and treasurer users preserved');
    
  } catch (error) {
    console.error('❌ Error truncating tables:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting Data Truncation');
    console.log('============================\n');
    
    await truncateAllTables();
    
    console.log('\n🎉 Data truncation completed successfully!');
    console.log('You can now enter data manually through the application.');
    
  } catch (error) {
    console.error('❌ Error during truncation:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
main();
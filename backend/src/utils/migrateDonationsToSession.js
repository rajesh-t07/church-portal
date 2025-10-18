const { Donation, DonationSession, Donor, sequelize } = require('../models');
const { Op } = require('sequelize');

async function migrateDonationsToSession() {
  try {
    console.log('Starting donation migration to session...');
    
    // Find donations that are not linked to any session
    const unlinkedDonations = await Donation.findAll({
      where: {
        sessionId: {
          [Op.is]: null
        }
      },
      include: [{ model: Donor, as: 'Donor' }]
    });
    
    if (unlinkedDonations.length === 0) {
      console.log('No unlinked donations found to migrate.');
      return;
    }
    
    console.log(`Found ${unlinkedDonations.length} unlinked donations to migrate.`);
    
    // Group donations by date (assuming they're from the same session if same date)
    const donationsByDate = {};
    unlinkedDonations.forEach(donation => {
      const donationDate = donation.date || donation.createdAt;
      const dateKey = new Date(donationDate).toISOString().split('T')[0]; // YYYY-MM-DD
      if (!donationsByDate[dateKey]) {
        donationsByDate[dateKey] = [];
      }
      donationsByDate[dateKey].push(donation);
    });
    
    // Create session for each date group
    for (const [dateKey, donations] of Object.entries(donationsByDate)) {
      console.log(`Creating session for date: ${dateKey}`);
      
      // Calculate totals
      const totalCash = donations
        .filter(d => d.method === 'cash')
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);
      
      const totalChecks = donations
        .filter(d => d.method === 'check')
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);
      
      const totalAmount = totalCash + totalChecks;
      
      // Ask for pastor gift amount (for demo, let's use $20 from cash)
      const pastorGift = Math.min(20, totalCash); // Take $20 from cash if available
      const netDeposit = totalAmount - pastorGift;
      
      // Create donation session
      const session = await DonationSession.create({
        sessionDate: new Date(dateKey),
        totalDonations: totalAmount,
        cashAmount: totalCash,
        checkAmount: totalChecks,
        pastorGift: pastorGift,
        netDeposit: netDeposit,
        donationCount: donations.length,
        enteredBy: 1, // Admin user ID
        notes: `Migrated session - Pastor gift: $${pastorGift} deducted from cash`
      });
      
      console.log(`Created session ${session.id} with pastor gift: $${pastorGift}`);
      
      // Link all donations to this session
      for (const donation of donations) {
        await donation.update({ sessionId: session.id });
        console.log(`Linked donation ${donation.id} to session ${session.id}`);
      }
      
      console.log(`Session ${session.id} summary:`);
      console.log(`  Total Cash: $${totalCash}`);
      console.log(`  Total Checks: $${totalChecks}`);
      console.log(`  Pastor Gift: $${pastorGift}`);
      console.log(`  Net Deposit: $${netDeposit}`);
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Run migration if called directly
if (require.main === module) {
  sequelize.authenticate()
    .then(() => migrateDonationsToSession())
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = migrateDonationsToSession;
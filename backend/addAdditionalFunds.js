const { User, Donation, Donor, DonationSession } = require('./src/models');

async function addAdditionalFunds() {
  try {
    console.log('💰 Adding additional funds to balance church finances...');
    
    // Get existing donors
    const donors = await Donor.findAll();
    
    if (donors.length === 0) {
      throw new Error('No donors found');
    }
    
    console.log(`Found ${donors.length} donors for additional funding`);
    
    // Helper function to get random donor
    function getRandomDonor() {
      return donors[Math.floor(Math.random() * donors.length)];
    }
    
    // Get a few wealthy donors for larger donations
    const wealthyDonors = donors.slice(0, 5); // First 5 donors as "wealthy"
    
    // Add monthly large donations for 2024 and 2025
    for (const year of [2024, 2025]) {
      console.log(`📅 Adding additional funds for ${year}...`);
      
      for (let month = 1; month <= 12; month++) {
        console.log(`   💵 Processing ${year}-${month.toString().padStart(2, '0')}...`);
        
        // Add 2-3 large donations per month to offset expenses
        const numLargeDonations = Math.floor(Math.random() * 2) + 2; // 2-3 donations
        
        for (let i = 0; i < numLargeDonations; i++) {
          const donor = wealthyDonors[i % wealthyDonors.length];
          
          // Random date within the month (avoid Sundays for variety)
          let day;
          do {
            day = Math.floor(Math.random() * 28) + 1;
            const testDate = new Date(year, month - 1, day);
          } while (new Date(year, month - 1, day).getDay() === 0); // Avoid Sundays
          
          const donationDate = new Date(year, month - 1, day);
          
          // Large donation amounts: $500-$1500
          const amount = Math.floor(Math.random() * 1000) + 500;
          const paymentMethod = Math.random() > 0.7 ? 'check' : 'cash'; // 30% checks, 70% cash
          
          try {
            // Create donation session
            const session = await DonationSession.create({
              sessionDate: donationDate,
              totalDonations: amount,
              cashAmount: paymentMethod === 'cash' ? amount : 0,
              checkAmount: paymentMethod === 'check' ? amount : 0,
              pastorGift: 0, // No pastor gift for special donations
              netDeposit: amount, // Full amount deposited
              donationCount: 1,
              enteredBy: 1, // Admin user
              notes: `Special donation - ${donor.firstName} ${donor.lastName}`
            });
            
            // Create the donation
            await Donation.create({
              donorId: donor.id,
              donorName: `${donor.firstName} ${donor.lastName}`,
              donorAddress: donor.address,
              donorEmail: donor.email,
              donorPhone: donor.phone,
              amount: amount,
              donationType: 'Special Offering',
              paymentMethod: paymentMethod,
              donationDate: donationDate,
              enteredBy: 1,
              sessionId: session.id,
              notes: 'Additional funding to balance church finances'
            });
            
            console.log(`     ✅ Added $${amount} from ${donor.firstName} ${donor.lastName}`);
            
          } catch (error) {
            console.log(`     ❌ Error creating donation: ${error.message}`);
          }
        }
        
        // Add some mid-size donations from other donors
        const numMidDonations = Math.floor(Math.random() * 3) + 1; // 1-3 donations
        
        for (let i = 0; i < numMidDonations; i++) {
          const donor = getRandomDonor();
          
          // Random date within the month
          let day;
          do {
            day = Math.floor(Math.random() * 28) + 1;
          } while (new Date(year, month - 1, day).getDay() === 0); // Avoid Sundays
          
          const donationDate = new Date(year, month - 1, day);
          
          // Mid-size donation amounts: $200-$500
          const amount = Math.floor(Math.random() * 300) + 200;
          const paymentMethod = Math.random() > 0.5 ? 'check' : 'cash'; // 50/50 split
          
          try {
            // Create donation session
            const session = await DonationSession.create({
              sessionDate: donationDate,
              totalDonations: amount,
              cashAmount: paymentMethod === 'cash' ? amount : 0,
              checkAmount: paymentMethod === 'check' ? amount : 0,
              pastorGift: 0, // No pastor gift for mid-size donations
              netDeposit: amount, // Full amount deposited
              donationCount: 1,
              enteredBy: 1, // Admin user
              notes: `Mid-size donation - ${donor.firstName} ${donor.lastName}`
            });
            
            // Create the donation
            await Donation.create({
              donorId: donor.id,
              donorName: `${donor.firstName} ${donor.lastName}`,
              donorAddress: donor.address,
              donorEmail: donor.email,
              donorPhone: donor.phone,
              amount: amount,
              donationType: 'Special Offering',
              paymentMethod: paymentMethod,
              donationDate: donationDate,
              enteredBy: 1,
              sessionId: session.id,
              notes: 'Additional funding for church operations'
            });
            
            console.log(`     ✅ Added $${amount} from ${donor.firstName} ${donor.lastName}`);
            
          } catch (error) {
            console.log(`     ❌ Error creating donation: ${error.message}`);
          }
        }
      }
    }
    
    console.log('🎉 Additional funding generation completed successfully!');
    console.log('📊 Summary:');
    console.log('   💰 Generated 2-3 large donations ($500-$1500) per month');
    console.log('   💵 Generated 1-3 mid-size donations ($200-$500) per month');
    console.log('   📅 Covered all months in 2024 and 2025');
    console.log('   ✅ Should provide positive net income for most months');
    console.log('');
    console.log('💡 Total additional funding per month: ~$2000-$4000');
    console.log('💡 This should offset monthly expenses (~$1500-$2000)');
    
  } catch (error) {
    console.error('❌ Error generating additional funds:', error);
  }
}

// Run the script
addAdditionalFunds();
// Fix donor totals script
const { Donor, Donation } = require('./src/models');

async function fixDonorTotals() {
  try {
    console.log('🔧 Checking donor data...');
    
    // Check donations first
    const donations = await Donation.findAll({
      order: [['donationDate', 'DESC']]
    });
    console.log('All donations:');
    donations.forEach(d => {
      console.log(`- ${d.donorName}: $${d.amount} (donorId: ${d.donorId})`);
    });
    
    // Check donors
    const donors = await Donor.findAll();
    console.log('\\nAll donors:');
    donors.forEach(d => {
      console.log(`- ID ${d.id}: ${d.firstName} ${d.lastName} (Total: $${d.totalDonations})`);
    });
    
    // Try to match donations to donors and update totals
    for (const donor of donors) {
      const fullName = `${donor.firstName} ${donor.lastName}`;
      console.log(`\\nProcessing: ${fullName}`);
      
      // Find donations that match this donor's name
      const matchingDonations = donations.filter(donation => {
        const donorNameLower = donation.donorName.toLowerCase().trim();
        const fullNameLower = fullName.toLowerCase().trim();
        return donorNameLower === fullNameLower || donorNameLower.includes(donor.firstName.toLowerCase());
      });
      
      console.log(`Found ${matchingDonations.length} matching donations`);
      
      if (matchingDonations.length > 0) {
        // Calculate totals
        const totalDonations = matchingDonations.reduce((sum, donation) => {
          return sum + parseFloat(donation.amount || 0);
        }, 0);
        
        const lastDonationDate = matchingDonations[0].donationDate;
        
        // Update donor record
        await donor.update({
          totalDonations: totalDonations,
          lastDonationDate: lastDonationDate
        });
        
        // Update donation records to link them to this donor
        for (const donation of matchingDonations) {
          await donation.update({ donorId: donor.id });
        }
        
        console.log(`✅ Updated: $${totalDonations.toFixed(2)}, Last: ${lastDonationDate}`);
      }
    }
    
    console.log('🎉 Donor totals fixed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixDonorTotals();
// Recalculate totals for all donors
exports.recalculateDonorTotals = async (req, res) => {
  try {
    console.log('🔧 Recalculating donor totals...');
    
    // Get all donors and donations
    const [donors, donations] = await Promise.all([
      Donor.findAll(),
      Donation.findAll({ order: [['donationDate', 'DESC']] })
    ]);
    
    let updatedCount = 0;
    
    for (const donor of donors) {
      const fullName = `${donor.firstName} ${donor.lastName}`;
      
      // Find donations that match this donor's name
      const matchingDonations = donations.filter(donation => {
        const donorNameLower = donation.donorName.toLowerCase().trim();
        const fullNameLower = fullName.toLowerCase().trim();
        return donorNameLower === fullNameLower || 
               donorNameLower.includes(donor.firstName.toLowerCase()) ||
               (donation.donorId && donation.donorId === donor.id);
      });
      
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
          if (!donation.donorId) {
            await donation.update({ donorId: donor.id });
          }
        }
        
        updatedCount++;
      }
    }
    
    res.json({ 
      message: `Donor totals recalculated successfully. Updated ${updatedCount} donors.`,
      updatedCount 
    });
  } catch (error) {
    console.error('Error recalculating donor totals:', error);
    res.status(500).json({ error: 'Failed to recalculate donor totals' });
  }
};
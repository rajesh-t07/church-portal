const { Donor, Donation } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../models');

// Update donor totals based on their donations
const updateDonorTotals = async (donorId) => {
  try {
    const donations = await Donation.findAll({
      where: { donorId: donorId },
      order: [['donationDate', 'DESC']]
    });

    const totalDonations = donations.reduce((sum, donation) => {
      return sum + parseFloat(donation.amount || 0);
    }, 0);

    const lastDonationDate = donations.length > 0 ? donations[0].donationDate : null;

    await Donor.update({
      totalDonations: totalDonations,
      lastDonationDate: lastDonationDate
    }, {
      where: { id: donorId }
    });

    return { totalDonations, lastDonationDate };
  } catch (error) {
    console.error('Error updating donor totals:', error);
    throw error;
  }
};

// Recalculate all donor totals
const recalculateAllDonorTotals = async () => {
  try {
    const donors = await Donor.findAll();
    
    for (const donor of donors) {
      await updateDonorTotals(donor.id);
    }
    
    return true;
  } catch (error) {
    console.error('Error recalculating donor totals:', error);
    throw error;
  }
};

// Search donors for autocomplete (First version - keeping for compatibility)
exports.searchDonorsOld = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const donors = await Donor.findAll({
      where: {
        [Op.or]: [
          {
            firstName: {
              [Op.like]: `%${query}%`
            }
          },
          {
            lastName: {
              [Op.like]: `%${query}%`
            }
          }
        ],
        isActive: true
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'totalDonations', 'lastDonationDate'],
      order: [
        ['firstName', 'ASC']
      ],
      limit: 10
    });

    // Format for frontend
    const formattedDonors = donors.map(donor => ({
      ...donor.toJSON(),
      name: `${donor.firstName} ${donor.lastName}`
    }));

    res.json(formattedDonors);
  } catch (error) {
    console.error('Error searching donors:', error);
    res.status(500).json({ error: 'Failed to search donors' });
  }
};

// Get or create donor
exports.getOrCreateDonor = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Donor name is required' });
    }

    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    // Try to find existing donor using LIKE for SQLite compatibility
    let donor = await Donor.findOne({
      where: {
        firstName: {
          [Op.like]: firstName
        },
        lastName: {
          [Op.like]: lastName
        }
      }
    });

    if (!donor) {
      // Create new donor
      donor = await Donor.create({
        firstName: firstName,
        lastName: lastName,
        email: email?.trim() || null,
        phone: phone?.trim() || null
      });
    } else {
      // Update contact info if provided
      const updateData = {};
      if (email && email.trim() !== donor.email) {
        updateData.email = email.trim();
      }
      if (phone && phone.trim() !== donor.phone) {
        updateData.phone = phone.trim();
      }
      
      if (Object.keys(updateData).length > 0) {
        await donor.update(updateData);
      }
    }

    res.json(donor);
  } catch (error) {
    console.error('Error getting/creating donor:', error);
    res.status(500).json({ error: 'Failed to process donor' });
  }
};

// Get all donors with donation totals
exports.getAllDonors = async (req, res) => {
  try {
    const donors = await Donor.findAll({
      where: {
        isActive: true
      },
      attributes: [
        'id',
        'firstName',
        'lastName',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'zipCode',
        'createdAt',
        [
          sequelize.literal(`(
            SELECT COALESCE(SUM(amount), 0)
            FROM Donations
            WHERE Donations.donorId = Donor.id
          )`),
          'totalGiven'
        ],
        [
          sequelize.literal(`(
            SELECT MAX(donationDate)
            FROM Donations
            WHERE Donations.donorId = Donor.id
          )`),
          'lastGiftDate'
        ]
      ],
      order: [
        [sequelize.literal('totalGiven'), 'DESC'],
        ['firstName', 'ASC']
      ]
    });

    res.json(donors);
  } catch (error) {
    console.error('Error getting donors:', error);
    res.status(500).json({ error: 'Failed to get donors', details: error.message });
  }
};

// Create new donor
exports.createDonor = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, city, state, zipCode } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    const donor = await Donor.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      zipCode: zipCode?.trim() || null
    });

    res.status(201).json(donor);
  } catch (error) {
    console.error('Error creating donor:', error);
    res.status(500).json({ error: 'Failed to create donor' });
  }
};

// Update donor
exports.updateDonor = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, address, city, state, zipCode } = req.body;

    const donor = await Donor.findByPk(id);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    await donor.update({
      firstName: firstName?.trim() || donor.firstName,
      lastName: lastName?.trim() || donor.lastName,
      email: email?.trim() || donor.email,
      phone: phone?.trim() || donor.phone,
      address: address?.trim() || donor.address,
      city: city?.trim() || donor.city,
      state: state?.trim() || donor.state,
      zipCode: zipCode?.trim() || donor.zipCode
    });

    res.json(donor);
  } catch (error) {
    console.error('Error updating donor:', error);
    res.status(500).json({ error: 'Failed to update donor' });
  }
};

// Delete donor
exports.deleteDonor = async (req, res) => {
  try {
    const { id } = req.params;

    const donor = await Donor.findByPk(id);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    // Soft delete by setting isActive to false
    await donor.update({ isActive: false });

    res.json({ message: 'Donor deleted successfully' });
  } catch (error) {
    console.error('Error deleting donor:', error);
    res.status(500).json({ error: 'Failed to delete donor' });
  }
};

// Get donor details with donation history
exports.getDonorDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const donor = await Donor.findByPk(id, {
      include: [{
        model: Donation,
        as: 'Donations',
        order: [['donationDate', 'DESC']],
        limit: 20
      }]
    });

    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    res.json(donor);
  } catch (error) {
    console.error('Error getting donor details:', error);
    res.status(500).json({ error: 'Failed to get donor details' });
  }
};

// Search donors for autocomplete
exports.searchDonors = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }
    
    const searchTerm = `%${q}%`;
    
    const donors = await Donor.findAll({
      attributes: [
        'id',
        'firstName', 
        'lastName',
        'email',
        'phone',
        'totalDonations',
        'lastDonationDate'
      ],
      where: {
        isActive: true,
        [Op.or]: [
          sequelize.where(
            sequelize.literal("firstName || ' ' || lastName"), 
            { [Op.like]: searchTerm }
          ),
          { firstName: { [Op.like]: searchTerm } },
          { lastName: { [Op.like]: searchTerm } },
          { email: { [Op.like]: searchTerm } }
        ]
      },
      order: [['firstName', 'ASC']],
      limit: 10
    });

    // Format the response for the frontend
    const formattedDonors = donors.map(donor => ({
      id: donor.id,
      name: `${donor.firstName} ${donor.lastName}`,
      firstName: donor.firstName,
      lastName: donor.lastName,
      email: donor.email,
      phone: donor.phone,
      totalDonations: donor.totalDonations || 0,
      lastDonationDate: donor.lastDonationDate
    }));

    res.json(formattedDonors);
  } catch (error) {
    console.error('Error searching donors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new donor
exports.createDonor = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, city, state, zipCode } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    const donor = await Donor.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      zipCode: zipCode?.trim() || null
    });

    res.status(201).json(donor);
  } catch (error) {
    console.error('Error creating donor:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'A donor with this information already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create donor' });
    }
  }
};

// Update donor
exports.updateDonor = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, address, city, state, zipCode } = req.body;

    const donor = await Donor.findByPk(id);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    await donor.update({
      firstName: firstName?.trim() || donor.firstName,
      lastName: lastName?.trim() || donor.lastName,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      zipCode: zipCode?.trim() || null
    });

    res.json(donor);
  } catch (error) {
    console.error('Error updating donor:', error);
    res.status(500).json({ error: 'Failed to update donor' });
  }
};

// Delete donor
exports.deleteDonor = async (req, res) => {
  try {
    const { id } = req.params;

    const donor = await Donor.findByPk(id);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    // Check if donor has donations
    const donationCount = await Donation.count({ where: { donorId: id } });
    if (donationCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete donor with existing donations. Archive instead.' 
      });
    }

    await donor.destroy();
    res.json({ message: 'Donor deleted successfully' });
  } catch (error) {
    console.error('Error deleting donor:', error);
    res.status(500).json({ error: 'Failed to delete donor' });
  }
};

// Get or create donor (for donation entry) - REMOVED DUPLICATE
// This function was merged with the one above

// Duplicate getAllDonors function removed - merged with the one above

// Get donor details with donation history
exports.getDonorDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const donor = await Donor.findByPk(id, {
      include: [{
        model: Donation,
        as: 'Donations',
        order: [['donationDate', 'DESC']],
        limit: 50
      }]
    });

    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    res.json(donor);
  } catch (error) {
    console.error('Error getting donor details:', error);
    res.status(500).json({ error: 'Failed to get donor details' });
  }
};

// Create donor records from existing donations
exports.createDonorsFromDonations = async (req, res) => {
  try {
    console.log('👥 Creating donor records from existing donations...');
    
    // Get all unique donor names from donations
    const uniqueDonorNames = await Donation.findAll({
      attributes: [
        'donorName',
        [sequelize.fn('COUNT', sequelize.col('id')), 'donationCount'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('MAX', sequelize.col('donationDate')), 'lastDonationDate']
      ],
      where: {
        donorName: {
          [Op.not]: null,
          [Op.ne]: ''
        }
      },
      group: ['donorName'],
      order: [['totalAmount', 'DESC']]
    });
    
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const donorData of uniqueDonorNames) {
      const fullName = donorData.donorName.trim();
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Check if donor already exists
      let donor = await Donor.findOne({
        where: {
          firstName: { [Op.like]: firstName },
          lastName: { [Op.like]: lastName }
        }
      });
      
      if (!donor) {
        // Create new donor
        donor = await Donor.create({
          firstName: firstName,
          lastName: lastName,
          email: null,
          phone: null,
          totalDonations: parseFloat(donorData.dataValues.totalAmount || 0),
          lastDonationDate: donorData.dataValues.lastDonationDate,
          isActive: true
        });
        createdCount++;
        console.log(`✅ Created donor: ${fullName}`);
      } else {
        // Update existing donor totals
        await donor.update({
          totalDonations: parseFloat(donorData.dataValues.totalAmount || 0),
          lastDonationDate: donorData.dataValues.lastDonationDate
        });
        updatedCount++;
        console.log(`🔄 Updated donor: ${fullName}`);
      }
      
      // Link all donations to this donor
      await Donation.update(
        { donorId: donor.id },
        { 
          where: { 
            donorName: fullName,
            donorId: null
          }
        }
      );
    }
    
    res.json({ 
      message: `Donor sync completed! Created ${createdCount} new donors, updated ${updatedCount} existing donors.`,
      createdCount,
      updatedCount,
      totalDonors: createdCount + updatedCount
    });
  } catch (error) {
    console.error('Error creating donors from donations:', error);
    res.status(500).json({ error: 'Failed to create donors from donations' });
  }
};

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
const express = require('express');
const { Donation, DonationSession } = require('../models');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/authMiddleware');
const pdfService = require('../services/pdfService');

const router = express.Router();

// Create donation session with reviewers
router.post('/create-session', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { donationDate, reviewer1, reviewer2, totalAmount, pastorGift } = req.body;
    const enteredBy = req.user.id;
    
    // Parse total amount properly to ensure we have the right values
    const totalDonations = parseFloat(totalAmount || 0);
    const pastorGiftAmount = parseFloat(pastorGift || 0);
    
    const session = await DonationSession.create({
      sessionDate: new Date(donationDate),
      totalDonations: totalDonations,
      cashAmount: 0, // Will be updated when donations are added
      checkAmount: 0, // Will be updated when donations are added
      pastorGift: pastorGiftAmount,
      netDeposit: totalDonations - pastorGiftAmount,
      reviewer1,
      reviewer2,
      enteredBy
    });
    
    res.status(201).json({
      sessionId: session.id,
      message: 'Session created successfully'
    });
  } catch (error) {
    console.error('Error creating donation session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate PDF for donation session
router.get('/session/:sessionId/pdf', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get session with donations
    const session = await DonationSession.findByPk(sessionId, {
      include: [
        {
          model: Donation,
          as: 'Donations'
        }
      ]
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Generate PDF using the new weekly offering summary method
    const pdfBuffer = await pdfService.generateWeeklyOfferingSummaryFromSession(session);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Weekly_Offering_Summary_${session.sessionDate.toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit donation session (multiple donations + pastor gift)
router.post('/submit-session', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { donations, pastorGift, sessionDate, notes } = req.body;
    const enteredBy = req.user.id;
    
    // Calculate totals
    const totalDonations = donations.reduce((sum, donation) => sum + parseFloat(donation.amount), 0);
    const cashAmount = donations.filter(d => d.paymentMethod === 'Cash').reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const checkAmount = donations.filter(d => d.paymentMethod === 'Check').reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const netDeposit = totalDonations - parseFloat(pastorGift || 0);
    
    // Create session
    const session = await DonationSession.create({
      sessionDate: new Date(sessionDate || new Date()),
      totalDonations,
      cashAmount,
      checkAmount,
      pastorGift: parseFloat(pastorGift || 0),
      netDeposit,
      donationCount: donations.length,
      enteredBy,
      notes
    });
    
    // Create individual donations linked to session
    const donationRecords = await Promise.all(
      donations.map(donation => 
        Donation.create({
          sessionId: session.id,
          donorId: donation.donorId,
          donorName: donation.donorName,
          amount: parseFloat(donation.amount),
          donationType: donation.donationType,
          paymentMethod: donation.paymentMethod,
          checkNumber: donation.checkNumber,
          donationDate: new Date(donation.donationDate || sessionDate || new Date()),
          enteredBy
        })
      )
    );
    
    res.status(201).json({
      session,
      donations: donationRecords,
      summary: {
        totalCollected: totalDonations,
        pastorGift: parseFloat(pastorGift || 0),
        netDeposit,
        donationCount: donations.length
      }
    });
  } catch (error) {
    console.error('Error submitting donation session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit individual donation (can be linked to session)
router.post('/submit', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { donorName, amount, donationType, paymentMethod, checkNumber, donationDate, sessionId } = req.body;
    const enteredBy = req.user.id;
    
    const donation = await Donation.create({
      sessionId: sessionId || null,
      donorName,
      amount,
      donationType,
      paymentMethod,
      checkNumber,
      donationDate: new Date(donationDate),
      enteredBy
    });
    
    // If part of a session, update session totals
    if (sessionId) {
      const session = await DonationSession.findByPk(sessionId);
      if (session) {
        const allSessionDonations = await Donation.findAll({
          where: { sessionId }
        });
        
        // Calculate totals from individual donations
        const individualDonationsTotal = allSessionDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
        const cashFromDonations = allSessionDonations.filter(d => d.paymentMethod === 'Cash').reduce((sum, d) => sum + parseFloat(d.amount), 0);
        const checkFromDonations = allSessionDonations.filter(d => d.paymentMethod === 'Check').reduce((sum, d) => sum + parseFloat(d.amount), 0);
        
        // Get the total amount from the session (which includes cash denominations)
        const sessionTotalDonations = parseFloat(session.totalDonations);
        
        // Calculate cash denominations (anonymous cash from offering plate)
        const cashDenominations = Math.max(0, sessionTotalDonations - individualDonationsTotal);
        
        // Total cash is individual cash donations plus cash denominations
        const totalCash = cashFromDonations + cashDenominations;
        
        await session.update({
          cashAmount: totalCash,
          checkAmount: checkFromDonations,
          donationCount: allSessionDonations.length,
          netDeposit: sessionTotalDonations - parseFloat(session.pastorGift || 0)
        });
      }
    }
    
    res.status(201).json(donation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get donation sessions with totals
router.get('/sessions', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let where = {};
    
    if (startDate && endDate) {
      where.sessionDate = {
        [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const sessions = await DonationSession.findAll({
      where,
      include: [
        { 
          model: require('../models').User, 
          as: 'EnteredBy',
          attributes: ['name', 'email']
        },
        {
          model: Donation,
          as: 'Donations',
          include: [{
            model: require('../models').Donor,
            as: 'Donor',
            required: false
          }]
        }
      ],
      order: [['sessionDate', 'DESC']]
    });
    
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching donation sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get donations
router.get('/', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { startDate, endDate, donorName, donationType } = req.query;
    let where = {};
    
    if (startDate && endDate) {
      where.donationDate = {
        [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    if (donorName) {
      where.donorName = {
        [require('sequelize').Op.iLike]: `%${donorName}%`
      };
    }
    
    if (donationType) {
      where.donationType = donationType;
    }
    
    const donations = await Donation.findAll({
      where,
      include: [
        { model: require('../models').User, as: 'EnteredBy' },
        { model: require('../models').Donor, as: 'Donor', required: false },
        { model: DonationSession, as: 'Session', required: false }
      ],
      order: [['donationDate', 'DESC']]
    });
    
    res.json(donations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate tax report for donor
router.get('/tax-report/:donorName', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { donorName } = req.params;
    const { year } = req.query;
    
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);
    
    const donations = await Donation.findAll({
      where: {
        donorName: {
          [require('sequelize').Op.iLike]: `%${donorName}%`
        },
        donationDate: {
          [require('sequelize').Op.between]: [startDate, endDate]
        }
      },
      order: [['donationDate', 'ASC']]
    });
    
    const totalByType = donations.reduce((acc, donation) => {
      if (!acc[donation.donationType]) {
        acc[donation.donationType] = 0;
      }
      acc[donation.donationType] += parseFloat(donation.amount);
      return acc;
    }, {});
    
    const grandTotal = donations.reduce((sum, donation) => sum + parseFloat(donation.amount), 0);
    
    res.json({
      donorName,
      year,
      donations,
      totalByType,
      grandTotal,
      donationCount: donations.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
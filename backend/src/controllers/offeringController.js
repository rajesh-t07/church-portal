const { Offering } = require('../models');
const { uploadToBlob } = require('../services/blobStorageService');
const pdfService = require('../services/pdfService');

exports.submitOffering = async (req, res) => {
  try {
    const { date, checks, cash, total, reviewer1, reviewer2 } = req.body;
    let depositSlipUrl = null;
    if (req.file) {
      depositSlipUrl = await uploadToBlob(req.file);
    }
    const offering = await Offering.create({
      date,
      checks: JSON.parse(checks),
      cash: JSON.parse(cash),
      total,
      reviewer1,
      reviewer2,
      depositSlipUrl
    });
    res.status(201).json(offering);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOfferings = async (req, res) => {
  try {
    const offerings = await Offering.findAll();
    res.json(offerings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDeposits = async (req, res) => {
  try {
    // Get deposits (offerings with deposit status)
    const deposits = await Offering.findAll({
      where: {
        status: ['Offerings Entered - Pending Deposit', 'Deposit Completed']
      },
      order: [['date', 'DESC']]
    });
    res.json(deposits);
  } catch (error) {
    console.error('Error fetching deposits:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.savePendingDeposit = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { weekData, totals, sessionId, reviewer1, reviewer2 } = req.body;

    if (!weekData) {
      return res.status(400).json({ error: 'weekData is required' });
    }

    if (!totals) {
      return res.status(400).json({ error: 'totals is required' });
    }

    // Parse weekData if it's a string
    const parsedWeekData = typeof weekData === 'string' ? JSON.parse(weekData) : weekData;
    const parsedTotals = typeof totals === 'string' ? JSON.parse(totals) : totals;

    console.log('Parsed weekData:', parsedWeekData);
    console.log('Parsed totals:', parsedTotals);

    if (!parsedWeekData) {
      return res.status(400).json({ error: 'Failed to parse weekData' });
    }

    // Safely get pastorGift with fallback
    const pastorGift = parsedWeekData?.pastorGift || 0;

    // Create the pending deposit record
    const depositRecord = await Offering.create({
      date: parsedWeekData.date,
      checks: parsedWeekData.checks,
      cash: parsedWeekData.cash,
      individualCashDonations: parsedWeekData.individualCashDonations || [],
      total: parsedTotals.totalOffering,
      pastorGift: parseFloat(pastorGift) || 0,
      finalDeposit: parsedTotals.finalDeposit,
      depositSlipUrl: null, // No deposit slip yet
      status: 'Offerings Entered - Pending Deposit', // Mark as pending
      cashTotal: parsedTotals.cashTotal,
      checksTotal: parsedTotals.checksTotal,
      submittedBy: req.user?.id || null,
      submittedAt: new Date(),
      sessionId: sessionId || null, // Link to donation session
      reviewer1: reviewer1 || null,
      reviewer2: reviewer2 || null
    });

    res.status(201).json({
      success: true,
      message: 'Deposit saved as pending. Upload bank slip later to complete.',
      deposit: depositRecord
    });
  } catch (error) {
    console.error('Error saving pending deposit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save pending deposit',
      details: error.message
    });
  }
};

exports.finalizeDeposit = async (req, res) => {
  try {
    const { weekData, pastorGift, totals } = req.body;
    let depositSlipUrl = null;

    // Upload deposit slip if provided
    if (req.file) {
      depositSlipUrl = await uploadToBlob(req.file);
    }

    // Parse weekData if it's a string
    const parsedWeekData = typeof weekData === 'string' ? JSON.parse(weekData) : weekData;
    const parsedTotals = typeof totals === 'string' ? JSON.parse(totals) : totals;

    // Create the final deposit record
    const depositRecord = await Offering.create({
      date: parsedWeekData.date,
      checks: parsedWeekData.checks,
      cash: parsedWeekData.cash,
      total: parsedTotals.totalOffering,
      pastorGift: parseFloat(pastorGift) || 0,
      finalDeposit: parsedTotals.finalDeposit,
      depositSlipUrl,
      status: 'finalized',
      cashTotal: parsedTotals.cashTotal,
      checksTotal: parsedTotals.checksTotal,
      submittedBy: req.user.id,
      submittedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Deposit finalized successfully',
      deposit: depositRecord
    });

  } catch (error) {
    console.error('Error finalizing deposit:', error);
    res.status(500).json({
      success: false,
      message: 'Error finalizing deposit',
      error: error.message
    });
  }
};

exports.updateDepositStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    let bankDepositSlipUrl = null;

    // Upload bank deposit slip if provided
    if (req.file) {
      bankDepositSlipUrl = await uploadToBlob(req.file);
    }

    const updateData = {
      status,
      updatedBy: req.user.id,
      updatedAt: new Date()
    };

    if (bankDepositSlipUrl) {
      updateData.bankDepositSlipUrl = bankDepositSlipUrl;
    }

    const [updatedRows] = await Offering.update(updateData, {
      where: { id },
      returning: true
    });

    if (updatedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found'
      });
    }

    const updatedDeposit = await Offering.findByPk(id);

    res.json({
      success: true,
      message: `Deposit ${status} successfully`,
      deposit: updatedDeposit
    });

  } catch (error) {
    console.error('Error updating deposit status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating deposit status',
      error: error.message
    });
  }
};

exports.generateOfferingSummaryPdf = async (req, res) => {
  try {
    const { id } = req.params;

    const offering = await Offering.findByPk(id);
    if (!offering) {
      return res.status(404).json({ message: 'Offering not found' });
    }

    // Parse and structure the data for PDF generation
    const offeringData = {
      id: offering.id,
      date: offering.date,
      cash: offering.cash ? (typeof offering.cash === 'string' ? JSON.parse(offering.cash) : offering.cash) : [],
      checks: offering.checks ? (typeof offering.checks === 'string' ? JSON.parse(offering.checks) : offering.checks) : [],
      individualCashDonations: offering.individualCashDonations ?
        (typeof offering.individualCashDonations === 'string' ? JSON.parse(offering.individualCashDonations) : offering.individualCashDonations) : [],
      pastorGift: offering.pastorGift || 0,
      total: offering.total || 0,
      finalDeposit: offering.finalDeposit || 0,
      cashTotal: offering.cashTotal || 0,
      checksTotal: offering.checksTotal || 0,
      status: offering.status || 'pending',
      reviewer1: offering.reviewer1,
      reviewer2: offering.reviewer2
    };

    // Generate PDF
    const pdfBuffer = await pdfService.generateWeeklyOfferingSummary(offeringData);

    // Set response headers for PDF download
    const offeringDate = new Date(offering.date).toISOString().split('T')[0];
    const filename = `Weekly_Offering_Summary_${offeringDate}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating offering summary PDF:', error);
    res.status(500).json({
      message: 'Error generating PDF',
      error: error.message
    });
  }
};
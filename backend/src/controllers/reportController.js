const { Expense, User, Donation, Donor, Offering, Reimbursement, DonationSession, PastorGift, ExpenseSubmission } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../models');
const pdfService = require('../services/pdfService');

// Debug endpoint to check what data exists
exports.getDataDebug = async (req, res) => {
  try {
    const donationCount = await Donation.count();
    const expenseCount = await Expense.count();
    const pastorGiftCount = await PastorGift.count();
    
    // Get date ranges of data
    const oldestDonation = await Donation.findOne({ order: [['donationDate', 'ASC']] });
    const newestDonation = await Donation.findOne({ order: [['donationDate', 'DESC']] });
    
    const oldestExpense = await Expense.findOne({ order: [['submissionDate', 'ASC']] });
    const newestExpense = await Expense.findOne({ order: [['submissionDate', 'DESC']] });

    // Get ALL donations to see what's in the database
    const allDonations = await Donation.findAll({
      attributes: ['id', 'donationDate', 'amount', 'donorName', 'paymentMethod'],
      order: [['donationDate', 'DESC']],
      limit: 10
    });
    
    res.json({
      counts: {
        donations: donationCount,
        expenses: expenseCount,
        pastorGifts: pastorGiftCount
      },
      dateRanges: {
        donations: {
          oldest: oldestDonation?.donationDate,
          newest: newestDonation?.donationDate
        },
        expenses: {
          oldest: oldestExpense?.submissionDate,
          newest: newestExpense?.submissionDate
        }
      },
      sampleDonations: allDonations
    });
  } catch (error) {
    console.error('Error getting debug data:', error);
    res.status(500).json({ message: 'Error getting debug data', error: error.message });
  }
};

// Get yearly dashboard summary (overall totals for the year)
exports.getYearlyDashboard = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    console.log(`=== YEARLY DASHBOARD CALLED FOR YEAR ${year} ===`);
    
    // Use proper date objects for timezone handling
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
    
    console.log(`Generating yearly dashboard for ${year}`);
    console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // First, let's get ALL donations to see what we have
    const allDonations = await Donation.findAll({
      attributes: ['donationDate', 'amount', 'paymentMethod'],
      order: [['donationDate', 'DESC']],
      limit: 10
    });
    console.log('All recent donations in DB:', allDonations.map(d => ({
      date: d.donationDate,
      amount: d.amount,
      method: d.paymentMethod
    })));

    // Get all offerings for the year - use proper date objects
    const offerings = await Donation.findAll({
      where: {
        donationDate: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    console.log(`Found ${offerings.length} offerings for year ${year}`);
    if (offerings.length > 0) {
      console.log('Sample offering dates:', offerings.slice(0, 3).map(o => o.donationDate));
    } else {
      // If no offerings found, let's see what dates actually exist
      const allOfferings = await Donation.findAll({ 
        attributes: ['donationDate'],
        limit: 5,
        order: [['donationDate', 'DESC']]
      });
      console.log('All recent offering dates in DB:', allOfferings.map(o => o.donationDate));
    }

    // Get all pastor gifts for the year
    const pastorGifts = await PastorGift.findAll({
      where: {
        weekDate: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    // Get all reimbursed expenses for the year
    const reimbursedExpenses = await Expense.findAll({
      where: {
        status: 'approved',
        approvedDate: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    // Get all direct church expenses for the year
    const directChurchExpenses = await Expense.findAll({
      where: {
        submissionDate: {
          [Op.between]: [startDate, endDate]
        },
        submissionId: null, // Direct expenses not part of reimbursement submissions
        status: 'approved'
      }
    });

    // Calculate totals
    const totalOfferings = offerings.reduce((sum, offering) => sum + parseFloat(offering.amount), 0);
    const cashOfferings = offerings.filter(o => o.paymentMethod === 'cash' || o.paymentMethod === 'Cash').reduce((sum, o) => sum + parseFloat(o.amount), 0);
    const checkOfferings = offerings.filter(o => o.paymentMethod === 'check' || o.paymentMethod === 'Check').reduce((sum, o) => sum + parseFloat(o.amount), 0);
    
    const totalPastorGifts = pastorGifts.reduce((sum, gift) => sum + parseFloat(gift.amount), 0);
    const totalExpensesReimbursed = reimbursedExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const totalDirectChurchExpenses = directChurchExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    
    const netOfferingsAfterPastorGifts = totalOfferings - totalPastorGifts;
    const totalAllExpenses = totalExpensesReimbursed + totalDirectChurchExpenses;
    const netChurchIncome = netOfferingsAfterPastorGifts - totalAllExpenses;

    console.log(`Yearly totals - Offerings: ${totalOfferings}, Expenses Reimbursed: ${totalExpensesReimbursed}, Direct Expenses: ${totalDirectChurchExpenses}, Net Income: ${netChurchIncome}`);

    res.json({
      year: parseInt(year),
      totalOfferings,
      cashOfferings,
      checkOfferings,
      totalExpensesReimbursed,
      totalDirectChurchExpenses,
      netChurchIncome,
      offeringCount: offerings.length,
      totalPastorGifts,
      netOfferingsAfterPastorGifts
    });
  } catch (error) {
    console.error('Error fetching yearly dashboard:', error);
    res.status(500).json({ message: 'Error fetching yearly dashboard' });
  }
};

// Get donation reports with session data
exports.getDonationReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    console.log('=== DONATION REPORT CALLED ===');
    console.log('Date range:', { startDate, endDate });
    
    const whereClause = {};
    if (startDate && endDate) {
      whereClause.donationDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    // Get all donations with donor information
    const donations = await Donation.findAll({
      where: whereClause,
      include: [
        {
          model: Donor,
          as: 'Donor',
          attributes: ['firstName', 'lastName'],
          required: false
        },
        {
          model: DonationSession,
          as: 'Session',
          required: false,
          include: [{
            model: User,
            as: 'EnteredBy',
            attributes: ['name', 'email']
          }]
        }
      ],
      order: [['donationDate', 'DESC']]
    });

    console.log(`Found ${donations.length} donations`);
    if (donations.length > 0) {
      console.log('Sample donation:', JSON.stringify(donations[0], null, 2));
    }

    // Get donation sessions for admin view
    const sessionWhereClause = {};
    if (startDate && endDate) {
      sessionWhereClause.sessionDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    const sessions = await DonationSession.findAll({
      where: sessionWhereClause,
      include: [
        {
          model: User,
          as: 'EnteredBy',
          attributes: ['name', 'email']
        },
        {
          model: Donation,
          as: 'Donations',
          include: [{
            model: Donor,
            as: 'Donor',
            required: false
          }]
        }
      ],
      order: [['sessionDate', 'DESC']]
    });

    // Calculate summary statistics
    const summary = {
      totalAmount: donations.reduce((sum, d) => sum + parseFloat(d.amount), 0),
      cashAmount: donations.filter(d => d.paymentMethod === 'cash' || d.paymentMethod === 'Cash').reduce((sum, d) => sum + parseFloat(d.amount), 0),
      checkAmount: donations.filter(d => d.paymentMethod === 'check' || d.paymentMethod === 'Check').reduce((sum, d) => sum + parseFloat(d.amount), 0),
      donationCount: donations.length,
      donorCount: [...new Set(donations.map(d => d.donorId).filter(Boolean))].length,
      sessionCount: sessions.length,
      totalPastorGifts: sessions.reduce((sum, s) => sum + parseFloat(s.pastorGift), 0),
      totalNetDeposits: sessions.reduce((sum, s) => sum + parseFloat(s.netDeposit), 0)
    };

    // Format donations for frontend
    const formattedDonations = donations.map(donation => ({
      ...donation.toJSON(),
      donorName: donation.Donor ? `${donation.Donor.firstName} ${donation.Donor.lastName}` : donation.donorName
    }));

    res.json({
      donations: formattedDonations,
      sessions,
      summary
    });
  } catch (error) {
    console.error('Error fetching donation report:', error);
    res.status(500).json({ message: 'Error fetching donation report' });
  }
};

// Get user-specific donations
exports.getMyDonations = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userName = req.user.name;
    
    const whereClause = {
      [Op.and]: [
        sequelize.where(sequelize.fn('LOWER', sequelize.col('donorName')), 'LIKE', '%' + userName.toLowerCase() + '%')
      ]
    };
    
    if (startDate && endDate) {
      whereClause.donationDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    const donations = await Donation.findAll({
      where: whereClause,
      include: [
        {
          model: Donor,
          as: 'Donor',
          attributes: ['firstName', 'lastName'],
          required: false
        },
        {
          model: DonationSession,
          as: 'Session',
          required: false
        }
      ],
      order: [['donationDate', 'DESC']]
    });

    const summary = {
      totalAmount: donations.reduce((sum, d) => sum + parseFloat(d.amount), 0),
      cashAmount: donations.filter(d => d.paymentMethod === 'Cash').reduce((sum, d) => sum + parseFloat(d.amount), 0),
      checkAmount: donations.filter(d => d.paymentMethod === 'Check').reduce((sum, d) => sum + parseFloat(d.amount), 0),
      donationCount: donations.length,
      donorCount: 1 // Always 1 for personal view
    };

    const formattedDonations = donations.map(donation => ({
      ...donation.toJSON(),
      donorName: donation.Donor ? `${donation.Donor.firstName} ${donation.Donor.lastName}` : donation.donorName
    }));

    res.json({
      donations: formattedDonations,
      sessions: [], // Members don't see session data
      summary
    });
  } catch (error) {
    console.error('Error fetching my donations:', error);
    res.status(500).json({ message: 'Error fetching my donations' });
  }
};

// Get expense reports
exports.getExpenseReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereClause = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [startDate, `${endDate} 23:59:59`]
      };
    }

    const expenses = await Expense.findAll({
      where: whereClause,
      include: [{
        model: User,
        attributes: ['name', 'email'],
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });

    const summary = {
      totalAmount: expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0),
      pendingCount: expenses.filter(e => e.status === 'pending').length,
      reimbursedCount: expenses.filter(e => e.status === 'reimbursed').length
    };

    res.json({
      expenses,
      summary
    });
  } catch (error) {
    console.error('Error fetching expense report:', error);
    res.status(500).json({ message: 'Error fetching expense report' });
  }
};

// Get weekly donation reports
exports.getWeeklyReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereClause = {};
    if (startDate && endDate) {
      whereClause.donationDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    // Get sessions for the same period to include deductions
    const sessionWhereClause = {};
    if (startDate && endDate) {
      sessionWhereClause.sessionDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    // Get pastor gifts for the same period
    const pastorGiftWhereClause = {};
    if (startDate && endDate) {
      pastorGiftWhereClause.weekDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    // Get donations, sessions, and pastor gifts
    const [donations, sessions, pastorGifts] = await Promise.all([
      Donation.findAll({
        where: whereClause,
        order: [['donationDate', 'DESC']]
      }),
      DonationSession.findAll({
        where: sessionWhereClause,
        order: [['sessionDate', 'DESC']]
      }),
      PastorGift.findAll({
        where: pastorGiftWhereClause,
        order: [['weekDate', 'DESC']]
      })
    ]);

    // Group donations by week manually
    const weeklyData = {};
    donations.forEach(donation => {
      const date = new Date(donation.donationDate);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          weekStart: weekKey,
          totalAmount: 0,
          cashAmount: 0,
          checkAmount: 0,
          donorCount: new Set(),
          donations: [],
          totalDeductions: 0,
          netDeposit: 0
        };
      }
      
      const amount = parseFloat(donation.amount);
      weeklyData[weekKey].totalAmount += amount;
      
      if (donation.paymentMethod === 'Cash') {
        weeklyData[weekKey].cashAmount += amount;
      } else if (donation.paymentMethod === 'Check') {
        weeklyData[weekKey].checkAmount += amount;
      }
      
      if (donation.donorId) {
        weeklyData[weekKey].donorCount.add(donation.donorId);
      }
      
      weeklyData[weekKey].donations.push(donation);
    });

    // Add session data (deductions) to weekly data
    sessions.forEach(session => {
      const date = new Date(session.sessionDate);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (weeklyData[weekKey]) {
        weeklyData[weekKey].totalDeductions += parseFloat(session.pastorGift || 0);
        weeklyData[weekKey].netDeposit += parseFloat(session.netDeposit || 0);
      }
    });

    // Add pastor gift data (simple weekly deductions) to weekly data
    pastorGifts.forEach(pastorGift => {
      const weekKey = pastorGift.weekDate;
      
      if (weeklyData[weekKey]) {
        weeklyData[weekKey].totalDeductions += parseFloat(pastorGift.amount || 0);
        weeklyData[weekKey].netDeposit = weeklyData[weekKey].totalAmount - weeklyData[weekKey].totalDeductions;
      }
    });

    // Convert to array and format
    const formattedWeeklyData = Object.values(weeklyData).map(week => ({
      weekStart: week.weekStart,
      totalAmount: week.totalAmount,
      cashAmount: week.cashAmount,
      checkAmount: week.checkAmount,
      donorCount: week.donorCount.size,
      totalDeductions: week.totalDeductions,
      netDeposit: week.netDeposit || (week.totalAmount - week.totalDeductions) // Calculate if not set
    }));

    res.json(formattedWeeklyData);
  } catch (error) {
    console.error('Error fetching weekly report:', error);
    res.status(500).json({ message: 'Error fetching weekly report' });
  }
};

// Get monthly financial summary reports
exports.getMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    // Default to 2024 if no year/month specified (since that's where our data is)
    const reportYear = year ? parseInt(year) : 2024;
    const reportMonth = month ? parseInt(month) : 10; // Default to October
    
    const startDate = new Date(reportYear, reportMonth - 1, 1);
    const endDate = new Date(reportYear, reportMonth, 0, 23, 59, 59);
    
    console.log(`Generating monthly report for ${reportYear}-${reportMonth.toString().padStart(2, '0')}`);
    console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    console.log(`Received parameters - year: ${year}, month: ${month}`);

    // 1. Get monthly offerings/donations
    const offerings = await Donation.findAll({
      where: {
        donationDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{
        model: Donor,
        as: 'Donor',
        required: false
      }],
      order: [['donationDate', 'DESC']]
    });

    // 2. Get monthly pastor gifts (deductions from offerings)
    const pastorGifts = await PastorGift.findAll({
      where: {
        weekDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['weekDate', 'DESC']]
    });

    // 3. Get expense submissions that were reimbursed this month
    const reimbursedExpenses = await Expense.findAll({
      where: {
        status: 'approved',
        approvedDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{
        model: User,
        as: 'User',
        attributes: ['name', 'email']
      }],
      order: [['approvedDate', 'DESC']]
    });

    // 4. Get direct church expenses (marked as church auto-pays)
    // These would be expenses entered directly by treasurer (rent, utilities, etc.)
    const directChurchExpenses = await Expense.findAll({
      where: {
        submissionDate: {
          [Op.between]: [startDate, endDate]
        },
        submissionId: null, // Direct expenses not part of reimbursement submissions
        status: 'approved'
      },
      include: [{
        model: User,
        as: 'User',
        attributes: ['name', 'email']
      }],
      order: [['submissionDate', 'DESC']]
    });

    // Calculate financial summary
    const totalOfferingsReceived = offerings.reduce((sum, offering) => sum + parseFloat(offering.amount), 0);
    const totalPastorGifts = pastorGifts.reduce((sum, gift) => sum + parseFloat(gift.amount), 0);
    const totalExpensesReimbursed = reimbursedExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const totalDirectChurchExpenses = directChurchExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    
    // Net calculations
    const netOfferingsAfterPastorGifts = totalOfferingsReceived - totalPastorGifts;
    const totalAllExpenses = totalExpensesReimbursed + totalDirectChurchExpenses;
    const netChurchIncome = netOfferingsAfterPastorGifts - totalAllExpenses;

    // Categorize offerings by payment method
    const cashOfferings = offerings.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + parseFloat(o.amount), 0);
    const checkOfferings = offerings.filter(o => o.paymentMethod === 'check').reduce((sum, o) => sum + parseFloat(o.amount), 0);

    // Categorize expenses by category
    const allExpenses = [...reimbursedExpenses, ...directChurchExpenses];
    const expensesByCategory = {};
    allExpenses.forEach(expense => {
      const category = expense.category || 'General';
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = {
          category,
          reimbursed: 0,
          direct: 0,
          total: 0,
          count: 0
        };
      }
      const amount = parseFloat(expense.amount);
      if (reimbursedExpenses.includes(expense)) {
        expensesByCategory[category].reimbursed += amount;
      } else {
        expensesByCategory[category].direct += amount;
      }
      expensesByCategory[category].total += amount;
      expensesByCategory[category].count += 1;
    });

    console.log(`Found ${offerings.length} offerings, ${pastorGifts.length} pastor gifts, ${reimbursedExpenses.length} reimbursed expenses, ${directChurchExpenses.length} direct expenses`);

    res.json({
      period: { 
        year: reportYear, 
        month: reportMonth,
        monthName: new Date(reportYear, reportMonth - 1).toLocaleString('default', { month: 'long' }),
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      summary: {
        // Offerings Section
        totalOfferingsReceived,
        cashOfferings,
        checkOfferings,
        offeringCount: offerings.length,
        
        // Deductions Section  
        totalPastorGifts,
        netOfferingsAfterPastorGifts,
        
        // Expenses Section
        totalExpensesReimbursed,
        totalDirectChurchExpenses,
        totalAllExpenses,
        
        // Net Income
        netChurchIncome
      },
      details: {
        offerings: offerings.map(offering => ({
          ...offering.toJSON(),
          donorName: offering.Donor ? `${offering.Donor.firstName} ${offering.Donor.lastName}` : offering.donorName
        })),
        pastorGifts,
        reimbursedExpenses,
        directChurchExpenses,
        expensesByCategory: Object.values(expensesByCategory).sort((a, b) => b.total - a.total)
      }
    });
  } catch (error) {
    console.error('Error fetching monthly report:', error);
    res.status(500).json({ message: 'Error fetching monthly report' });
  }
};

// Generate tax forms
exports.generateTaxForms = async (req, res) => {
  try {
    const { year } = req.body;
    
    // Get all donors who gave during the specified year
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    const donors = await Donor.findAll({
      include: [{
        model: Donation,
        as: 'Donations',
        where: {
          donationDate: {
            [Op.between]: [startDate, endDate]
          }
        },
        required: true
      }]
    });

    // Calculate total giving for each donor
    const donorSummaries = donors.map(donor => {
      const totalGiving = donor.Donations.reduce((sum, donation) => sum + parseFloat(donation.amount), 0);
      return {
        donor,
        totalGiving,
        donationCount: donor.Donations.length
      };
    }).filter(summary => summary.totalGiving > 0);

    // Here you would generate PDF tax forms and email them
    // For now, we'll just return the summary
    
    res.json({
      message: 'Tax forms would be generated and emailed',
      year,
      donorCount: donorSummaries.length,
      totalGiving: donorSummaries.reduce((sum, s) => sum + s.totalGiving, 0)
    });
  } catch (error) {
    console.error('Error generating tax forms:', error);
    res.status(500).json({ message: 'Error generating tax forms' });
  }
};

// Export reports as PDF
exports.exportReport = async (req, res) => {
  try {
    const { reportType } = req.params;
    const { startDate, endDate, year } = req.query;
    
    let pdfBuffer;
    const dateRange = {
      startDate: startDate || `${new Date().getFullYear()}-01-01`,
      endDate: endDate || new Date().toISOString().split('T')[0]
    };
    const reportYear = year || new Date().getFullYear();

    switch (reportType) {
      case 'offerings':
        // Get offerings data
        const offeringsData = await getDonationReportData(dateRange);
        pdfBuffer = await pdfService.generateOfferingsReport(offeringsData, dateRange);
        break;

      case 'expenses': 
        // Get expenses data
        const expensesData = await getExpenseReportData(dateRange);
        pdfBuffer = await pdfService.generateExpensesReport(expensesData, dateRange);
        break;

      case 'donor-summary':
        // Get donor summary data
        const donorData = await getDonorSummaryData(reportYear);
        pdfBuffer = await pdfService.generateDonorSummaryReport(donorData, reportYear);
        break;

      case 'weekly':
        // For weekly reports, use offerings data with weekly grouping
        const weeklyData = await getDonationReportData(dateRange);
        pdfBuffer = await pdfService.generateOfferingsReport(weeklyData, dateRange);
        break;

      default:
        return res.status(400).json({ 
          message: `Report type "${reportType}" is not supported for PDF export` 
        });
    }

    // Set PDF response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send the PDF
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating PDF export:', error);
    res.status(500).json({ message: 'Error generating PDF report', error: error.message });
  }
};

// Helper function to get donation report data
async function getDonationReportData(dateRange) {
  const donations = await Donation.findAll({
    where: {
      donationDate: {
        [Op.between]: [dateRange.startDate, dateRange.endDate]
      }
    },
    include: [
      {
        model: Donor,
        as: 'Donor',
        attributes: ['name', 'email']
      }
    ],
    order: [['donationDate', 'DESC']]
  });

  const summary = {
    totalAmount: donations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0),
    cashAmount: donations.filter(d => d.paymentMethod?.toLowerCase() === 'cash')
                        .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0),
    checkAmount: donations.filter(d => d.paymentMethod?.toLowerCase() === 'check')
                         .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0),
    donationCount: donations.length
  };

  return { donations, summary };
}

// Helper function to get expense report data
async function getExpenseReportData(dateRange) {
  const expenses = await Expense.findAll({
    where: {
      submissionDate: {
        [Op.between]: [dateRange.startDate, dateRange.endDate]
      }
    },
    order: [['submissionDate', 'DESC']]
  });

  return { expenses };
}

// Helper function to get donor summary data
async function getDonorSummaryData(year) {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const donorSummary = await sequelize.query(`
    SELECT 
      d.id,
      d.name,
      d.email,
      COALESCE(SUM(don.amount), 0) as totalAmount,
      COUNT(don.id) as donationCount
    FROM Donors d
    LEFT JOIN Donations don ON d.id = don.donorId 
      AND don.donationDate BETWEEN :startDate AND :endDate
    GROUP BY d.id, d.name, d.email
    HAVING COUNT(don.id) > 0
    ORDER BY totalAmount DESC
  `, {
    replacements: { startDate, endDate },
    type: sequelize.QueryTypes.SELECT
  });

  return donorSummary;
}

// Export individual donor report as PDF
exports.exportIndividualDonorReport = async (req, res) => {
  try {
    const { donorId } = req.params;
    const { year = new Date().getFullYear() } = req.query;
    
    // Get individual donor report data
    const donorReportData = await getIndividualDonorReportData(donorId, year);
    
    if (!donorReportData) {
      return res.status(404).json({ message: 'Donor not found or no donations in specified year' });
    }
    
    // Generate PDF
    const pdfBuffer = await pdfService.generateIndividualDonorReport(donorReportData, year);
    
    // Set PDF response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 
      `attachment; filename="donor-report-${donorReportData.donorName.replace(/\s+/g, '-')}-${year}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send the PDF
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating individual donor PDF:', error);
    res.status(500).json({ message: 'Error generating donor PDF report', error: error.message });
  }
};

// Helper function to get individual donor report data
async function getIndividualDonorReportData(donorId, year) {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  // Get donor information
  const donor = await Donor.findByPk(donorId);
  if (!donor) return null;

  // Get donations for the year
  const donations = await Donation.findAll({
    where: {
      donorId: donorId,
      donationDate: {
        [Op.between]: [startDate, endDate]
      }
    },
    order: [['donationDate', 'ASC']]
  });

  if (donations.length === 0) return null;

  const totalAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
  const averageGift = totalAmount / donations.length;

  return {
    donorName: donor.name,
    donorEmail: donor.email,
    totalAmount,
    donationCount: donations.length,
    averageGift,
    donations: donations.map(d => ({
      donationDate: d.donationDate,
      amount: d.amount,
      paymentMethod: d.paymentMethod,
      purpose: d.purpose
    }))
  };
}

// Get member-specific donation reports
exports.getMyDonationReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    const userName = req.user.name;
    
    console.log('=== MY DONATION REPORT DEBUG ===');
    console.log('User ID:', userId);
    console.log('User Name:', userName);
    console.log('User object:', req.user);
    console.log('===============================');
    
    // Build where clause to show donations this user recorded
    const whereClause = {
      enteredBy: userId // Only show donations this user recorded
    };
    
    if (startDate && endDate) {
      whereClause.donationDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    const donations = await Donation.findAll({
      where: whereClause,
      include: [{
        model: Donor,
        as: 'Donor',
        attributes: ['firstName', 'lastName'],
        required: false // Allow donations without linked donors
      }],
      order: [['donationDate', 'DESC']],
      limit: 50 // Limit for performance
    });

    // Calculate summary statistics
    const summary = {
      totalAmount: donations.reduce((sum, d) => sum + parseFloat(d.amount), 0),
      cashAmount: donations.filter(d => d.paymentMethod === 'Cash').reduce((sum, d) => sum + parseFloat(d.amount), 0),
      checkAmount: donations.filter(d => d.paymentMethod === 'Check').reduce((sum, d) => sum + parseFloat(d.amount), 0),
      donationCount: donations.length,
      donorCount: [...new Set(donations.map(d => d.donorId).filter(Boolean))].length
    };

    res.json({
      donations,
      summary
    });
  } catch (error) {
    console.error('Error fetching my donation report:', error);
    res.status(500).json({ message: 'Error fetching donation report' });
  }
};

// Get member-specific expense reports
exports.getMyExpenseReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id; // Get from auth middleware
    
    const whereClause = {
      userId: userId // Filter by the current user
    };
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [startDate, `${endDate} 23:59:59`]
      };
    }

    const expenses = await Expense.findAll({
      where: whereClause,
      include: [{
        model: User,
        attributes: ['name', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: 50 // Limit for performance
    });

    const summary = {
      totalAmount: expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0),
      pendingCount: expenses.filter(e => e.status === 'pending').length,
      reimbursedCount: expenses.filter(e => e.status === 'reimbursed').length
    };

    res.json({
      expenses,
      summary
    });
  } catch (error) {
    console.error('Error fetching my expense report:', error);
    res.status(500).json({ message: 'Error fetching expense report' });
  }
};

// Legacy functions for backward compatibility
exports.getExpensesReport = exports.getExpenseReport;
exports.getYearlyOfferingReport = async (req, res) => {
  try {
    // Legacy offering report - redirect to donation report
    req.query.startDate = `${new Date().getFullYear()}-01-01`;
    req.query.endDate = `${new Date().getFullYear()}-12-31`;
    return exports.getDonationReport(req, res);
  } catch (error) {
    console.error('Error fetching yearly offering report:', error);
    res.status(500).json({ message: 'Error fetching yearly offering report' });
  }
};

exports.getTaxForm = async (req, res) => {
  try {
    // Legacy tax form endpoint
    req.body.year = new Date().getFullYear();
    return exports.generateTaxForms(req, res);
  } catch (error) {
    console.error('Error getting tax form:', error);
    res.status(500).json({ message: 'Error getting tax form' });
  }
};

// Get individual donor reports (annual giving per donor)
exports.getIndividualDonorReports = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    // Get donations with donor information
    const donations = await Donation.findAll({
      where: {
        donationDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Donor,
          as: 'Donor',
          required: false,
          attributes: ['id', 'firstName', 'lastName', 'email', 'address', 'city', 'state', 'zipCode']
        }
      ],
      order: [['donationDate', 'ASC']]
    });
    
    // Group by donor
    const donorReports = {};
    
    donations.forEach(donation => {
      const donorKey = donation.donorId || donation.donorName || 'Anonymous';
      const donorName = donation.Donor ? 
        `${donation.Donor.firstName} ${donation.Donor.lastName}` : 
        donation.donorName || 'Anonymous';
      
      if (!donorReports[donorKey]) {
        donorReports[donorKey] = {
          donorId: donation.donorId,
          donorName: donorName,
          donorInfo: donation.Donor,
          totalAmount: 0,
          cashAmount: 0,
          checkAmount: 0,
          donationCount: 0,
          donations: []
        };
      }
      
      const amount = parseFloat(donation.amount);
      donorReports[donorKey].totalAmount += amount;
      donorReports[donorKey].donationCount += 1;
      
      if (donation.paymentMethod === 'Cash') {
        donorReports[donorKey].cashAmount += amount;
      } else if (donation.paymentMethod === 'Check') {
        donorReports[donorKey].checkAmount += amount;
      }
      
      donorReports[donorKey].donations.push({
        date: donation.donationDate,
        amount: amount,
        type: donation.donationType,
        method: donation.paymentMethod,
        checkNumber: donation.checkNumber
      });
    });
    
    const formattedReports = Object.values(donorReports)
      .sort((a, b) => b.totalAmount - a.totalAmount);
    
    res.json({ year, donors: formattedReports });
  } catch (error) {
    console.error('Error getting individual donor reports:', error);
    res.status(500).json({ message: 'Error getting individual donor reports' });
  }
};

// Get individual donor report for a specific donor
exports.getIndividualDonorReport = async (req, res) => {
  try {
    const { donorId } = req.params;
    const { year = new Date().getFullYear() } = req.query;
    
    console.log(`🔍 INDIVIDUAL DONOR REPORT DEBUG:`);
    console.log(`   Donor ID: ${donorId}`);
    console.log(`   Year from query: ${year}`);
    console.log(`   Year type: ${typeof year}`);
    console.log(`   Full query params:`, req.query);
    
    // Use proper date objects for timezone handling
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
    
    console.log(`   Start date: ${startDate.toISOString()}`);
    console.log(`   End date: ${endDate.toISOString()}`);
    
    // Get donations for specific donor
    const donations = await Donation.findAll({
      where: {
        donorId: donorId,
        donationDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Donor,
          as: 'Donor',
          attributes: ['id', 'firstName', 'lastName', 'email', 'address', 'city', 'state', 'zipCode']
        }
      ],
      order: [['donationDate', 'ASC']]
    });
    
    console.log(`   Found ${donations.length} donations for donor ${donorId} in ${year}`);
    if (donations.length > 0) {
      console.log(`   First donation date: ${donations[0].donationDate}`);
      console.log(`   Last donation date: ${donations[donations.length - 1].donationDate}`);
    }
    
    res.json(donations);
  } catch (error) {
    console.error('Error getting individual donor report:', error);
    res.status(500).json({ message: 'Error getting individual donor report', error: error.message });
  }
};

// Get individual expense reports (expenses by person)
exports.getIndividualExpenseReports = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    // Get expense submissions with user information
    const submissions = await ExpenseSubmission.findAll({
      where: {
        submissionDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Expense,
          as: 'Expenses'
        }
      ],
      order: [['submissionDate', 'DESC']]
    });
    
    // Group by user
    const userReports = {};
    
    submissions.forEach(submission => {
      const userId = submission.userId;
      const userName = submission.User ? submission.User.name : 'Unknown User';
      
      if (!userReports[userId]) {
        userReports[userId] = {
          userId: userId,
          userName: userName,
          userEmail: submission.User?.email,
          totalSubmitted: 0,
          totalApproved: 0,
          totalReimbursed: 0,
          submissionCount: 0,
          approvedCount: 0,
          submissions: []
        };
      }
      
      const amount = parseFloat(submission.totalAmount);
      userReports[userId].totalSubmitted += amount;
      userReports[userId].submissionCount += 1;
      
      if (submission.status === 'approved') {
        userReports[userId].totalApproved += amount;
        userReports[userId].approvedCount += 1;
        userReports[userId].totalReimbursed += amount; // Assuming approved = reimbursed
      }
      
      userReports[userId].submissions.push({
        id: submission.id,
        date: submission.submissionDate,
        amount: amount,
        status: submission.status,
        approvedDate: submission.approvedDate,
        expenseCount: submission.Expenses?.length || 0,
        expenses: submission.Expenses || []
      });
    });
    
    const formattedReports = Object.values(userReports)
      .sort((a, b) => b.totalSubmitted - a.totalSubmitted);
    
    res.json({ year, users: formattedReports });
  } catch (error) {
    console.error('Error getting individual expense reports:', error);
    res.status(500).json({ message: 'Error getting individual expense reports' });
  }
};

// Get expense category reports
exports.getExpenseCategoryReports = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    // Get all expenses within date range
    const expenses = await Expense.findAll({
      where: {
        expenseDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: ExpenseSubmission,
          attributes: ['status', 'userId'],
          include: [
            {
              model: User,
              as: 'User',
              attributes: ['name', 'email']
            }
          ]
        }
      ],
      order: [['expenseDate', 'DESC']]
    });
    
    // Group by category
    const categoryReports = {};
    
    expenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      
      if (!categoryReports[category]) {
        categoryReports[category] = {
          category: category,
          totalAmount: 0,
          reimbursableAmount: 0,
          directExpenseAmount: 0,
          expenseCount: 0,
          expenses: []
        };
      }
      
      const amount = parseFloat(expense.amount);
      categoryReports[category].totalAmount += amount;
      categoryReports[category].expenseCount += 1;
      
      // Determine if it's reimbursable (has submission) or direct expense
      if (expense.ExpenseSubmission) {
        categoryReports[category].reimbursableAmount += amount;
      } else {
        categoryReports[category].directExpenseAmount += amount;
      }
      
      categoryReports[category].expenses.push({
        id: expense.id,
        date: expense.expenseDate,
        amount: amount,
        description: expense.description,
        vendor: expense.vendor,
        isReimbursable: !!expense.ExpenseSubmission,
        submissionStatus: expense.ExpenseSubmission?.status,
        submittedBy: expense.ExpenseSubmission?.User?.name
      });
    });
    
    const formattedReports = Object.values(categoryReports)
      .sort((a, b) => b.totalAmount - a.totalAmount);
    
    res.json({ year, categories: formattedReports });
  } catch (error) {
    console.error('Error getting expense category reports:', error);
    res.status(500).json({ message: 'Error getting expense category reports' });
  }
};

// Get all users for dropdowns
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email'],
      order: [['name', 'ASC']]
    });
    
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Error getting users' });
  }
};

// Get individual user expense report
exports.getIndividualUserExpenseReport = async (req, res) => {
  try {
    const { userId } = req.params;
    const { year = new Date().getFullYear() } = req.query;
    
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    // Get user information
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email']
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get expense submissions for the specific user
    const submissions = await ExpenseSubmission.findAll({
      where: {
        userId: userId,
        submissionDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Expense,
          as: 'Expenses'
        }
      ],
      order: [['submissionDate', 'DESC']]
    });
    
    // Calculate totals
    let totalSubmitted = 0;
    let totalApproved = 0;
    let totalReimbursed = 0;
    let submissionCount = submissions.length;
    let approvedCount = 0;
    
    const submissionDetails = submissions.map(submission => {
      const amount = parseFloat(submission.totalAmount) || 0;
      totalSubmitted += amount;
      
      if (submission.status === 'approved') {
        totalApproved += amount;
        totalReimbursed += amount; // Assuming approved = reimbursed
        approvedCount++;
      }
      
      return {
        id: submission.id,
        date: submission.submissionDate,
        amount: amount,
        status: submission.status,
        approvedDate: submission.approvedDate,
        expenseCount: submission.Expenses?.length || 0,
        expenses: submission.Expenses || []
      };
    });
    
    const reportData = {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      year: parseInt(year),
      totalSubmitted,
      totalApproved,
      totalReimbursed,
      submissionCount,
      approvedCount,
      submissions: submissionDetails
    };
    
    res.json(reportData);
  } catch (error) {
    console.error('Error getting individual user expense report:', error);
    res.status(500).json({ message: 'Error getting individual user expense report' });
  }
};

// Dashboard statistics endpoint
exports.getDashboardStats = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);

    // Get total donations this year
    const totalDonationsResult = await Donation.sum('amount', {
      where: {
        donationDate: {
          [Op.between]: [new Date(currentYear, 0, 1), new Date(currentYear, 11, 31)]
        }
      }
    });

    // Get monthly offerings (this month)
    const monthlyOfferingResult = await Donation.sum('amount', {
      where: {
        donationDate: {
          [Op.between]: [firstDayOfMonth, lastDayOfMonth]
        }
      }
    });

    // Get total unique donors/members
    const totalDonors = await Donor.count({
      where: {
        isActive: true
      }
    });

    // Get pending expense submissions
    const pendingExpenses = await ExpenseSubmission.count({
      where: {
        status: 'pending'
      }
    });

    res.json({
      totalDonations: totalDonationsResult || 0,
      monthlyOffering: monthlyOfferingResult || 0,
      totalDonors: totalDonors || 0,
      pendingExpenses: pendingExpenses || 0
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ 
      totalDonations: 0,
      monthlyOffering: 0,
      totalDonors: 0,
      pendingExpenses: 0
    });
  }
};
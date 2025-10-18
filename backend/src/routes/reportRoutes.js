const express = require('express');
const reportController = require('../controllers/reportController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Donation reports
router.get('/donations', ensureAuthenticated, reportController.getDonationReport);

// Member-specific reports
router.get('/my-donations', ensureAuthenticated, reportController.getMyDonations);
router.get('/my-expenses', ensureAuthenticated, reportController.getMyExpenseReport);

// Expense reports
router.get('/expenses', ensureAuthenticated, ensureAdmin, reportController.getExpenseReport);

// Weekly reports
router.get('/weekly', ensureAuthenticated, reportController.getWeeklyReport);

// Monthly reports
router.get('/monthly', ensureAuthenticated, reportController.getMonthlyReport);

// Yearly dashboard
router.get('/yearly-dashboard', ensureAuthenticated, reportController.getYearlyDashboard);

// Debug endpoint
router.get('/debug', ensureAuthenticated, reportController.getDataDebug);

// Dashboard statistics
router.get('/dashboard-stats', ensureAuthenticated, reportController.getDashboardStats);

// Tax form generation
router.post('/tax-forms', ensureAuthenticated, ensureAdmin, reportController.generateTaxForms);

// Individual donor reports (annual giving per donor)
router.get('/individual-donors', ensureAuthenticated, ensureAdmin, reportController.getIndividualDonorReports);
router.get('/individual-donor/:donorId', ensureAuthenticated, ensureAdmin, reportController.getIndividualDonorReport);
router.get('/individual-donor/:donorId/pdf', ensureAuthenticated, ensureAdmin, reportController.exportIndividualDonorReport);

// Individual expense reports (expenses by person)
router.get('/individual-expenses', ensureAuthenticated, ensureAdmin, reportController.getIndividualExpenseReports);
router.get('/individual-expense/:userId', ensureAuthenticated, ensureAdmin, reportController.getIndividualUserExpenseReport);

// Get all users for dropdowns
router.get('/users', ensureAuthenticated, ensureAdmin, reportController.getAllUsers);

// Expense category reports
router.get('/expense-categories', ensureAuthenticated, ensureAdmin, reportController.getExpenseCategoryReports);

// Export reports
router.get('/export/:reportType', ensureAuthenticated, reportController.exportReport);

module.exports = router;
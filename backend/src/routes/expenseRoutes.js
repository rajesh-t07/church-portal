const express = require('express');
const multer = require('multer');
const { 
  submitExpense, 
  getExpenses, 
  getSubmissions,
  approveExpense, 
  rejectExpense,
  approveSubmission,
  rejectSubmission
} = require('../controllers/expenseController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 20 // Allow up to 20 files
  }
});

// New submission-based routes
router.post('/submit', ensureAuthenticated, upload.any(), submitExpense);
router.get('/submissions', ensureAuthenticated, getSubmissions);
router.post('/approve-submission', ensureAuthenticated, ensureAdmin, upload.single('reimbursementReceipt'), approveSubmission);
router.post('/reject-submission', ensureAuthenticated, ensureAdmin, rejectSubmission);

// Legacy individual expense routes (for backward compatibility)
router.get('/', ensureAuthenticated, getExpenses);
router.post('/approve', ensureAuthenticated, ensureAdmin, upload.single('reimbursementReceipt'), approveExpense);
router.post('/reject', ensureAuthenticated, ensureAdmin, rejectExpense);

module.exports = router;
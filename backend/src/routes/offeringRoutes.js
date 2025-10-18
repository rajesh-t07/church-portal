const express = require('express');
const multer = require('multer');
const { submitOffering, getOfferings, getDeposits, finalizeDeposit, savePendingDeposit, updateDepositStatus, generateOfferingSummaryPdf } = require('../controllers/offeringController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/submit', ensureAuthenticated, ensureAdmin, upload.single('depositSlip'), submitOffering);
router.post('/save-pending', ensureAuthenticated, ensureAdmin, savePendingDeposit);
router.post('/pending-deposit', ensureAuthenticated, ensureAdmin, savePendingDeposit);
router.post('/finalize-deposit', ensureAuthenticated, ensureAdmin, upload.single('depositSlip'), finalizeDeposit);
router.put('/:id/status', ensureAuthenticated, ensureAdmin, upload.single('bankDepositSlip'), updateDepositStatus);
router.get('/', ensureAuthenticated, getOfferings);
router.get('/deposits', ensureAuthenticated, ensureAdmin, getDeposits);
router.get('/:id/pdf', ensureAuthenticated, generateOfferingSummaryPdf);

module.exports = router;
const express = require('express');
const multer = require('multer');
const { submitReimbursement, getReimbursements } = require('../controllers/reimbursementController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/submit', ensureAuthenticated, ensureAdmin, upload.single('receipt'), submitReimbursement);
router.get('/', ensureAuthenticated, getReimbursements);

module.exports = router;
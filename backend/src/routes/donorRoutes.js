const express = require('express');
const { 
  searchDonors, 
  createDonor,
  updateDonor,
  deleteDonor,
  getOrCreateDonor, 
  getDonorDetails, 
  getAllDonors,
  recalculateDonorTotals,
  createDonorsFromDonations
} = require('../controllers/donorController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all donors (must be before /:id routes)
router.get('/', ensureAuthenticated, getAllDonors);

// Search donors for autocomplete
router.get('/search', ensureAuthenticated, searchDonors);

// Create new donor
router.post('/', ensureAuthenticated, createDonor);

// Get or create donor (for donation entry)
router.post('/get-or-create', ensureAuthenticated, getOrCreateDonor);

// Get donor details
router.get('/:id', ensureAuthenticated, getDonorDetails);

// Update donor
router.put('/:id', ensureAuthenticated, updateDonor);

// Delete donor
router.delete('/:id', ensureAuthenticated, deleteDonor);

// Recalculate donor totals
router.post('/recalculate-totals', ensureAuthenticated, recalculateDonorTotals);

// Create donors from existing donations
router.post('/sync-from-donations', ensureAuthenticated, createDonorsFromDonations);

module.exports = router;
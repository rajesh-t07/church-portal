const express = require('express');
const router = express.Router();
const pastorGiftController = require('../controllers/pastorGiftController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(ensureAuthenticated);

// POST /api/pastor-gifts - Add pastor gift
router.post('/', pastorGiftController.addPastorGift);

// GET /api/pastor-gifts - Get pastor gifts
router.get('/', pastorGiftController.getPastorGifts);

// PUT /api/pastor-gifts/:id - Update pastor gift
router.put('/:id', pastorGiftController.updatePastorGift);

// DELETE /api/pastor-gifts/:id - Delete pastor gift
router.delete('/:id', pastorGiftController.deletePastorGift);

module.exports = router;
const express = require('express');
const router = express.Router();
const { addHistory, getHistory } = require('../controllers/historyController');
const { protect } = require('../middleware/authMiddleware');

// Route for getting reading history (for the logged in user)
// GET /api/history
router.get('/', protect, getHistory);

// Route for adding reading history
// POST /api/history
router.post('/', protect, addHistory);

module.exports = router;

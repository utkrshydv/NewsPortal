const express = require('express');
const router = express.Router();
const { getRecommendations, getRecommendedCategories } = require('../controllers/recommendationController');

// Route for getting recommended categories only
// GET /api/recommendations/categories/:userId
router.get('/categories/:userId', getRecommendedCategories);

// Route for getting recommendations algorithmically 
// GET /api/recommendations/:userId
router.get('/:userId', getRecommendations);

module.exports = router;

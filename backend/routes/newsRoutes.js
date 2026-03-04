const express = require('express');
const router = express.Router();
const { getAllNews, getNewsById, getRegionalNews, getTrendingTopics, searchNews } = require('../controllers/newsController');

// Route for getting all news articles
// GET /api/news
router.get('/', getAllNews);

// Route for getting regional news by state
// GET /api/news/region?state=Name
router.get('/region', getRegionalNews);

// Route for getting live trending topics
// GET /api/news/trending
router.get('/trending', getTrendingTopics);

// Route for searching news
// GET /api/news/search?q=Query
router.get('/search', searchNews);

// Route for getting a single news article by ID
// GET /api/news/:id
router.get('/:id', getNewsById);

module.exports = router;

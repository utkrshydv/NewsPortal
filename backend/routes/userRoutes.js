const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updatePreferences,
  toggleBookmark,
  getBookmarkedArticles,
  updateAvatar,
  resetProfile,
  submitOnboarding,
  trackInteraction,
  getProfileGrowth,
  getReadingInsights,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/profile').get(protect, getUserProfile);
router.route('/profile/growth').get(protect, getProfileGrowth);
router.route('/profile/reading-insights').get(protect, getReadingInsights);
router.route('/preferences').put(protect, updatePreferences);
router.route('/bookmarks').get(protect, getBookmarkedArticles).post(protect, toggleBookmark);
router.route('/avatar').put(protect, updateAvatar);
router.route('/reset').delete(protect, resetProfile);
router.route('/onboarding').post(protect, submitOnboarding);
router.route('/interactions').post(protect, trackInteraction);

module.exports = router;

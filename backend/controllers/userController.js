const User = require('../models/User');
const Interaction = require('../models/Interaction');
const newsData = require('../data/newsData'); // For fetching bookmarked articles

// @desc    Get user profile alongside reading statistics
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // 1. Fetch Reading History
      const History = require('../models/History');
      const history = await History.find({ user: user._id }).sort({ timestamp: -1 });

      // 2. Calculate Statistics
      const totalArticlesRead = history.length;

      // Calculate Top Categories (up to 3)
      let topCategories = [];
      if (totalArticlesRead > 0) {
        const categoryCounts = {};
        history.forEach(item => {
          categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
        });

        // Sort categories by count descending
        const sortedCats = Object.entries(categoryCounts)
          .sort((a, b) => b[1] - a[1])
          .map(entry => entry[0]);

        topCategories = sortedCats.slice(0, 3);
      }

      // Maintain legacy topCategory for UI compatibility if needed, but primarily use topCategories
      const topCategory = topCategories.length > 0 ? topCategories[0] : 'None';

      // Calculate Reading Streak (consecutive days)
      let currentStreak = 0;
      if (totalArticlesRead > 0) {
        let lastDate = new Date();
        lastDate.setHours(0, 0, 0, 0); // Normalize to midnight

        let streakActive = true;
        const uniqueDates = [...new Set(history.map(h => {
          const d = new Date(h.timestamp || h.createdAt);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        }))];

        for (let i = 0; i < uniqueDates.length; i++) {
          const checkDate = new Date(lastDate);
          checkDate.setDate(checkDate.getDate() - i);

          if (uniqueDates.includes(checkDate.getTime())) {
            currentStreak++;
          } else if (i === 0) {
            // It's okay if they haven't read *today* yet, check yesterday
            const yesterday = new Date(lastDate);
            yesterday.setDate(yesterday.getDate() - 1);
            if (uniqueDates.includes(yesterday.getTime())) {
              currentStreak++;
            } else {
              streakActive = false;
              break;
            }
          } else {
            streakActive = false;
            break;
          }
        }
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences, // We can keep this for legacy reasons, but UI will use topCategories
        bookmarkedArticles: user.bookmarkedArticles,
        avatar: user.avatar,
        onboardingCompleted: user.onboardingCompleted,
        explicitPreferences: user.explicitPreferences,
        interactionCount: user.interactionCount,
        categoryWeights: user.categoryWeights,
        stats: {
          totalArticlesRead,
          topCategory,
          topCategories,
          currentStreak
        }
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
const updatePreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.preferences = req.body.preferences || user.preferences;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        preferences: updatedUser.preferences,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle article bookmark
// @route   POST /api/users/bookmarks
// @access  Private
const toggleBookmark = async (req, res) => {
  try {
    const { articleId } = req.body;

    if (!articleId) {
      return res.status(400).json({ message: 'Article ID is required' });
    }

    const user = await User.findById(req.user._id);

    if (user) {
      // Convert all to strings for reliable comparison
      const articleIdStr = String(articleId);
      const isBookmarked = user.bookmarkedArticles.some(id => String(id) === articleIdStr);

      if (isBookmarked) {
        user.bookmarkedArticles = user.bookmarkedArticles.filter(id => String(id) !== articleIdStr);
      } else {
        user.bookmarkedArticles.push(articleIdStr);
      }

      await user.save();

      res.json({ bookmarkedArticles: user.bookmarkedArticles });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get bookmarked articles full data
// @route   GET /api/users/bookmarks
// @access  Private
const getBookmarkedArticles = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      const bookmarks = user.bookmarkedArticles || [];
      const localBookmarks = newsData.filter(article =>
        bookmarks.includes(article.id) || bookmarks.includes(String(article._id))
      );

      // Fetch from MongoDB cached Live articles
      const Article = require('../models/Article');
      const dbBookmarksRaw = await Article.find({ articleId: { $in: bookmarks } });
      const dbBookmarks = dbBookmarksRaw.map(dbA => ({
        id: dbA.articleId || String(dbA._id),
        title: dbA.title,
        category: dbA.category,
        shortDescription: dbA.shortDescription,
        content: dbA.content,
        imageUrl: dbA.imageUrl,
        sourceUrl: dbA.sourceUrl, // <-- FIX: include sourceUrl
        date: dbA.date,
      }));

      // Combine and deduplicate
      let combined = [...localBookmarks, ...dbBookmarks];
      const seen = new Set();
      const finalBookmarks = [];
      for (const article of combined) {
        if (!seen.has(article.id)) {
          seen.add(article.id);
          finalBookmarks.push(article);
        }
      }

      res.json(finalBookmarks);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching bookmarked articles:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user avatar
// @route   PUT /api/users/avatar
// @access  Private
const updateAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.avatar = req.body.avatarUrl || user.avatar;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        preferences: updatedUser.preferences,
        bookmarkedArticles: updatedUser.bookmarkedArticles,
        avatar: updatedUser.avatar,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating avatar:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset user profile (clear history, bookmarks, preferences)
// @route   DELETE /api/users/reset
// @access  Private
const resetProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // 1. Clear all history for this user
      const History = require('../models/History');
      await History.deleteMany({ user: user._id });

      // 2. Clear user preferences and bookmarks
      user.preferences = [];
      user.bookmarkedArticles = [];

      const updatedUser = await user.save();

      res.json({
        message: 'Profile successfully reset.',
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        preferences: updatedUser.preferences,
        bookmarkedArticles: updatedUser.bookmarkedArticles,
        avatar: updatedUser.avatar,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error resetting profile:', error);
    res.status(500).json({ message: 'Server error during profile reset' });
  }
};

// @desc    Submit Onboarding categories
// @route   POST /api/users/onboarding
// @access  Private
const submitOnboarding = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.onboardingCompleted = true;
      user.explicitPreferences = req.body.categories || [];
      // Also set the legacy preferences to be roughly equivalent
      user.preferences = req.body.categories || user.preferences;

      // Initialize behavior-driven weights
      const allCategories = ['Technology', 'Business', 'Science', 'Health', 'Sports', 'Entertainment', 'Politics', 'Environment', 'World'];
      const initialWeights = new Map();
      allCategories.forEach(cat => {
        if (user.explicitPreferences.includes(cat)) {
          initialWeights.set(cat, 1.0);
        } else {
          initialWeights.set(cat, 0.1); // baseline for non-selected
        }
      });
      user.categoryWeights = initialWeights;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        preferences: updatedUser.preferences,
        onboardingCompleted: updatedUser.onboardingCompleted,
        explicitPreferences: updatedUser.explicitPreferences,
        interactionCount: updatedUser.interactionCount,
        categoryWeights: updatedUser.categoryWeights,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error submitting onboarding:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Track implicit user interaction
// @route   POST /api/users/interactions
// @access  Private
const trackInteraction = async (req, res) => {
  try {
    const { articleId, category, actionType } = req.body;

    if (!articleId || !category || !actionType) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Determine weight bump based on action
    let weightBump = 0;
    switch (actionType) {
      case 'click': weightBump = 0.05; break;
      case 'read': weightBump = 0.15; break;
      case 'bookmark': weightBump = 0.30; break;
      case 'share': weightBump = 0.30; break;
      case 'dislike': weightBump = -0.20; break;
      default: weightBump = 0.01;
    }

    // Save interaction record
    await Interaction.create({
      userId: user._id,
      articleId,
      category,
      actionType,
      weight: weightBump
    });

    // Update user category weights
    user.interactionCount += 1;

    let currentWeight = user.categoryWeights.get(category);
    if (currentWeight === undefined) currentWeight = 0.1;
    let newWeight = Math.max(currentWeight + weightBump, 0); // Keep >= 0

    user.categoryWeights.set(category, newWeight);

    // Decay 5% every 10 interactions to prevent explosion
    if (user.interactionCount % 10 === 0) {
      for (const [key, value] of user.categoryWeights.entries()) {
        user.categoryWeights.set(key, Math.max(0.05, value * 0.95));
      }
    }

    await user.save();
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error tracking interaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user reading profile growth
// @route   GET /api/users/profile/growth
// @access  Private
const getProfileGrowth = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const History = require('../models/History');

    // Aggregate reads per day
    const historyData = await History.aggregate([
      {
        $match: {
          user: req.user._id,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing days
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const found = historyData.find(h => h._id === dateString);
      result.push({
        date: monthDay,
        fullDate: dateString,
        reads: found ? found.count : 0
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching profile growth:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get reading behavior insights
// @route   GET /api/users/profile/reading-insights
// @access  Private
const getReadingInsights = async (req, res) => {
  try {
    const History = require('../models/History');

    // Default timeframe is exactly 7 days (trailing week)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    const historyData = await History.find({
      user: req.user._id,
      timestamp: { $gte: startDate }
    });

    // Metric 1: Articles This Week
    const articlesThisWeek = historyData.length;

    // Fast-return if complete cold start
    if (articlesThisWeek === 0) {
      return res.json({
        mostActiveHour: 'N/A',
        articlesThisWeek: 0
      });
    }

    // Metric 2: Most Active Hour
    const hourCounts = {};

    historyData.forEach(item => {
      // Hour logic
      const hour = new Date(item.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    let mostActiveHour = 'N/A';
    if (Object.keys(hourCounts).length > 0) {
      const topHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0];
      const hourInt = parseInt(topHour);
      const ampm = hourInt >= 12 ? 'PM' : 'AM';
      let formattedHour = hourInt % 12;
      formattedHour = formattedHour ? formattedHour : 12; // 0 should be 12 AM
      mostActiveHour = `${formattedHour} ${ampm}`;
    }

    res.json({
      mostActiveHour,
      articlesThisWeek
    });

  } catch (error) {
    console.error('Error fetching reading insights:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUserProfile,
  updatePreferences,
  toggleBookmark,
  getBookmarkedArticles,
  updateAvatar,
  resetProfile,
  submitOnboarding,
  trackInteraction,
  getProfileGrowth,
  getReadingInsights
};

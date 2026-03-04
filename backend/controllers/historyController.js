const History = require('../models/History');

// @desc    Add reading history
// @route   POST /api/history
// @access  Private
const addHistory = async (req, res) => {
  try {
    const { articleId, category, timestamp, readingDurationSeconds, scrollDepthPercent } = req.body;

    // Support either req.user._id (protected route) or req.body.userId (fallback if needed for testing)
    const userId = req.user ? req.user._id : req.body.userId;

    if (!userId || !articleId || !category) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const baseRecord = {
      user: userId,
      articleId,
      category,
    };
    if (timestamp) baseRecord.timestamp = timestamp;
    if (readingDurationSeconds) baseRecord.readingDurationSeconds = readingDurationSeconds;
    if (scrollDepthPercent) baseRecord.scrollDepthPercent = scrollDepthPercent;

    const historyRecord = await History.create(baseRecord);

    // --- Auto-Preference Update Logic ---
    // If the user reads multiple articles in a specific category, automatically add it to their preferences
    try {
      const User = require('../models/User');
      const recentHistory = await History.find({ user: userId })
        .sort({ timestamp: -1 })
        .limit(10); // Look at their 10 most recent reads

      // Count occurrences of the current category in recent history
      const categoryCount = recentHistory.filter(h => h.category === category).length;

      // If they've read at least 3 articles in this category recently, consider it an implicit preference
      if (categoryCount >= 3) {
        const user = await User.findById(userId);
        if (user && !user.preferences.includes(category)) {
          console.log(`Auto-adding preference '${category}' for user ${user.email} based on reading habits.`);
          user.preferences.push(category);
          await user.save();
        }
      }
    } catch (prefErr) {
      console.error('Error auto-updating preferences:', prefErr);
      // We don't fail the history request if the preference analyzer fails
    }

    res.status(201).json(historyRecord);
  } catch (error) {
    console.error('Error adding history:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get user reading history
// @route   GET /api/history
// @access  Private
const getHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    // Fetch user's history, sort by most recent first
    const history = await History.find({ user: userId }).sort({ timestamp: -1 });

    // We need to hydrate the history records with actual article data
    const Article = require('../models/Article');

    const hydratedHistory = await Promise.all(history.map(async (record) => {
      // Find the corresponding article by articleId
      const article = await Article.findOne({ articleId: record.articleId });

      // Return a combined object that the frontend is expecting
      return {
        ...record.toObject(),
        article: article || null // attach article if found
      };
    }));

    // Filter out history records where the article was not found (optional, but good practice)
    const validHistory = hydratedHistory.filter(h => h.article !== null);

    res.json(validHistory);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  addHistory,
  getHistory,
};

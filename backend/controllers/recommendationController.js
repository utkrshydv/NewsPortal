const User = require('../models/User');
const History = require('../models/History');
const Article = require('../models/Article');
const newsData = require('../data/newsData'); // Static fallback pool

// @desc    Get recommended news articles based on user preferences and reading history
// @route   GET /api/recommendations/:userId
// @access  Public (But usually called with logged-in user ID)
const getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page } = req.query;

    // 1. Fetch User details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Determine Stage Multipliers & Exploration
    let alpha = 0.6, beta = 0.3, gamma = 0.1;
    let explorationRatio = 0.1; // Stage 1 defaults

    const interactCount = user.interactionCount || 0;
    if (interactCount > 50) {
      alpha = 0.8; beta = 0.05; gamma = 0.15; explorationRatio = 0.25; // Stage 4: Mature
    } else if (interactCount > 10) {
      alpha = 0.75; beta = 0.1; gamma = 0.15; explorationRatio = 0.2; // Stage 3: Learning
    } else if (interactCount > 0) {
      alpha = 0.65; beta = 0.2; gamma = 0.15; // Stage 2: Early
    }

    // Identify user's top categories
    let topCategories = [];
    if (user.categoryWeights && user.categoryWeights.size > 0) {
      const sortedWeights = Array.from(user.categoryWeights.entries()).sort((a, b) => b[1] - a[1]);
      // Top 2 implicit categories
      topCategories = sortedWeights.slice(0, 2).map(w => w[0]);
    } else if (user.explicitPreferences && user.explicitPreferences.length > 0) {
      // Fallback to explicit
      topCategories = user.explicitPreferences.slice(0, 2);
    } else {
      topCategories = ['Technology', 'Business']; // Absolute fallback
    }

    // 3. Fetch read history to filter pool
    const historyData = await History.find({ user: userId });
    const readArticleIds = new Set(historyData.map(h => h.articleId));

    // 4. Build Candidate Pool
    const dbArticlesRaw = await Article.find({}).sort({ date: -1 }).limit(300); // Fetch recent articles
    const dbArticles = dbArticlesRaw.map(a => ({
      id: a.articleId || String(a._id),
      title: a.title,
      category: a.category,
      shortDescription: a.shortDescription,
      content: a.content,
      imageUrl: a.imageUrl,
      sourceUrl: a.sourceUrl,
      date: a.date,
      globalViews: a.globalViews || 0,
      trendingScore: a.trendingScore || 0
    }));

    let combinedPool = [...dbArticles, ...newsData];
    let unreadPool = [];
    let seenIds = new Set();

    for (const article of combinedPool) {
      const articleIdStr = String(article.id);
      if (!readArticleIds.has(articleIdStr) && !seenIds.has(articleIdStr)) {
        seenIds.add(articleIdStr);
        unreadPool.push(article);
      }
    }

    // 5. Score Candidates
    const MAX_VIEWS = 1000;
    const scoredArticles = unreadPool.map(article => {
      // Personalization (W_user,cat)
      let pScore = 0.1; // Default
      if (user.categoryWeights && user.categoryWeights.has(article.category)) {
        pScore = user.categoryWeights.get(article.category);
      } else if (user.explicitPreferences && user.explicitPreferences.includes(article.category)) {
        pScore = 1.0;
      }

      // Popularity (0-1)
      let popScore = Math.min((article.trendingScore || 0) / 100 + (article.globalViews || 0) / MAX_VIEWS, 1.0);

      // Recency (0-1 exponential decay)
      let articleDate = article.date ? new Date(article.date).getTime() : Date.now();
      const hoursOld = Math.max((Date.now() - articleDate) / 3600000, 0);
      const recencyScore = Math.exp(-0.05 * hoursOld);

      // Final Score Formula
      const finalScore = (alpha * pScore) + (beta * popScore) + (gamma * recencyScore);
      return { article, score: finalScore };
    });

    // Sort strictly Descending by analytical score
    scoredArticles.sort((a, b) => b.score - a.score);

    // 6. Exploration vs Exploitation Routing
    const exploitationList = [];
    const explorationList = [];

    for (const item of scoredArticles) {
      if (topCategories.includes(item.article.category)) {
        exploitationList.push(item.article);
      } else {
        explorationList.push(item.article);
      }
    }

    let organizedFeed = [];
    const explFrequency = Math.round(1 / explorationRatio); // e.g. 0.2 ratio = 1 in every 5
    let explIdx = 0;
    let exploIdx = 0;

    const totalToPick = exploitationList.length + explorationList.length;
    for (let i = 0; i < totalToPick; i++) {
      // Interleave exploration item
      if (i > 0 && i % explFrequency === 0 && explIdx < explorationList.length) {
        organizedFeed.push(explorationList[explIdx++]);
      } else if (exploIdx < exploitationList.length) {
        organizedFeed.push(exploitationList[exploIdx++]);
      } else if (explIdx < explorationList.length) {
        organizedFeed.push(explorationList[explIdx++]);
      }
    }

    // 7. Paginate
    const pageNum = parseInt(page) || 1;
    const limit = 6; // Matching frontend UI expectations
    const startIndex = (pageNum - 1) * limit;
    const endIndex = pageNum * limit;
    const paginatedRecs = organizedFeed.slice(startIndex, endIndex);
    const hasNextPage = endIndex < organizedFeed.length;

    res.status(200).json({
      articles: paginatedRecs,
      nextPage: hasNextPage ? (pageNum + 1).toString() : null
    });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ message: 'Server Error calculating recommendations' });
  }
};
// @desc    Get recommended categories only based on user preferences and reading history
// @route   GET /api/recommendations/categories/:userId
// @access  Public (But usually called with logged-in user ID)
const getRecommendedCategories = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const historyData = await History.find({ user: userId });

    const categoryCounts = {};
    historyData.forEach(item => {
      if (item.category.toLowerCase() !== 'all' && item.category.toLowerCase() !== 'general') {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      }
    });

    const readingCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 5); // Let's get up to 5 so we have a good pool

    // Combine explicit preferences with implicit reading history
    const allCategoriesRaw = [
      ...(user.explicitPreferences || []),
      ...(user.preferences || []),
      ...readingCategories
    ];

    // Deduplicate and normalize case to Title Case (e.g. "business" -> "Business")
    const categoriesSet = new Set(
      allCategoriesRaw.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase())
    );

    const finalCategories = Array.from(categoriesSet);

    // Fallbacks if they have literally no preferences or history
    if (finalCategories.length === 0) {
      return res.status(200).json({ categories: ['Technology', 'Business', 'Science'] });
    }

    res.status(200).json({ categories: finalCategories });

  } catch (error) {
    console.error('Error fetching recommendation categories:', error);
    res.status(500).json({ message: 'Server Error calculating recommendation categories' });
  }
};

module.exports = {
  getRecommendations,
  getRecommendedCategories,
};

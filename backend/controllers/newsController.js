const axios = require('axios');
const googleTrends = require('google-trends-api');
const newsData = require('../data/newsData');
const Article = require('../models/Article');

// @desc    Get all news articles
// @route   GET /api/news
// @access  Public
const getAllNews = async (req, res) => {
  try {
    const { category, page } = req.query;

    const apiKey = process.env.NEWSDATA_API_KEY || 'pub_4747058ef8a042a2b3eca103a75a7ba1';
    let url = `https://newsdata.io/api/1/news?apikey=${apiKey}&language=en&country=in`;

    if (page) {
      url += `&page=${page}`;
    }

    const validCategories = ['business', 'entertainment', 'environment', 'food', 'health', 'politics', 'science', 'sports', 'technology', 'tourism', 'world'];

    if (category && category.toLowerCase() !== 'all') {
      let cat = category.toLowerCase();
      // Map 'general' to 'top' for newsdata.io
      if (cat === 'general') cat = 'top';

      if (cat === 'top' || validCategories.includes(cat)) {
        url += `&category=${cat}`;
      }
    } else {
      // Pick 3 random categories to make the "All" tab diverse and random
      const shuffled = [...validCategories].sort(() => 0.5 - Math.random());
      const randomCats = shuffled.slice(0, 3).join(',');
      url += `&category=${randomCats}`;
    }

    const response = await axios.get(url, { timeout: 10000 });

    if (response.data && response.data.results) {
      // Filter out duplicates by title
      const uniqueResults = [];
      const seenTitles = new Set();

      for (const article of response.data.results) {
        if (article.title && !seenTitles.has(article.title)) {
          seenTitles.add(article.title);
          uniqueResults.push(article);
        }
      }

      // Map the external API format to our internal format
      const newsList = uniqueResults.slice(0, 20).map((article, index) => {
        let displayCategory = 'General';

        if (article.category && Array.isArray(article.category) && article.category.length > 0) {
          const cleanCats = article.category.filter(c => c !== 'top' && c !== 'general');
          let catStrToUse = cleanCats.length > 0 ? cleanCats[0] : article.category[0];
          displayCategory = catStrToUse.charAt(0).toUpperCase() + catStrToUse.slice(1);
        } else if (category && category !== 'All') {
          displayCategory = category;
        } else {
          // Fallback random category
          const fallbackArray = ['Business', 'Technology', 'Science', 'Health', 'Sports', 'Entertainment', 'Environment'];
          displayCategory = fallbackArray[Math.floor(Math.random() * fallbackArray.length)];
        }

        return {
          articleId: article.article_id || `live-${Date.now()}-${index}`,
          title: article.title || 'Untitled',
          category: displayCategory,
          shortDescription: article.description || 'No description available.',
          content: article.content || article.description || 'No content available.',
          imageUrl: article.image_url || 'https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=2072&auto=format&fit=crop',
          sourceUrl: article.link || '',
          date: article.pubDate ? new Date(article.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        };
      });

      // Upsert to DB to ensure detail pages and bookmarks persist
      const savedNewsPromises = newsList.map(async (newsObj) => {
        try {
          await Article.findOneAndUpdate(
            { articleId: newsObj.articleId },
            newsObj,
            { upsert: true, returnDocument: 'after' }
          );
        } catch (dbErr) {
          console.error('Error saving article to db:', dbErr);
        }
      });
      Promise.allSettled(savedNewsPromises);

      const formattedList = newsList.map(n => ({ ...n, id: n.articleId }));
      // Sort consistently by date to ensure stable pagination
      return res.json({
        articles: formattedList.sort((a, b) => new Date(b.date) - new Date(a.date)),
        nextPage: response.data.nextPage || null
      });
    }

    throw new Error('Invalid format from live API');

  } catch (error) {
    console.error('Error fetching live news, falling back to local data:', error.message);

    let filteredData = newsData;
    const { category, page } = req.query;

    if (category && category.toLowerCase() !== 'all') {
      filteredData = newsData.filter(item =>
        item.category.toLowerCase() === category.toLowerCase()
      );
    } else {
      // Sort fallback data consistently by date for reliable pagination
      filteredData = [...filteredData].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    const newsList = filteredData.map(({ id, title, category, shortDescription, imageUrl, date }) => ({
      id,
      title,
      category,
      shortDescription,
      imageUrl,
      date
    }));

    // Mock pagination for fallback data
    const pageNum = parseInt(page) || 1;
    const limit = 10;
    const startIndex = (pageNum - 1) * limit;
    const endIndex = pageNum * limit;
    const paginatedList = newsList.slice(startIndex, endIndex);
    const hasNextPage = endIndex < newsList.length;

    res.json({
      articles: paginatedList,
      nextPage: hasNextPage ? (pageNum + 1).toString() : null
    });
  }
};

// @desc    Get single news article by ID
// @route   GET /api/news/:id
// @access  Public
const getNewsById = async (req, res) => {
  try {
    // 1. Check local static data
    const localNews = newsData.find((n) => n.id === req.params.id);
    if (localNews) {
      return res.json(localNews);
    }

    // 2. Check cached DB data (live articles that were fetched)
    const dbArticle = await Article.findOne({ articleId: req.params.id });
    if (dbArticle) {
      return res.json({
        id: dbArticle.articleId,
        title: dbArticle.title,
        category: dbArticle.category,
        shortDescription: dbArticle.shortDescription,
        content: dbArticle.content,
        imageUrl: dbArticle.imageUrl,
        sourceUrl: dbArticle.sourceUrl,
        date: dbArticle.date,
      });
    }

    res.status(404).json({ message: 'News article not found' });
  } catch (err) {
    console.error('Error in getNewsById:', err);
    res.status(500).json({ message: 'Server error fetching article details' });
  }
};

// @desc    Get regional news by state
// @route   GET /api/news/region
// @access  Public
const getRegionalNews = async (req, res) => {
  try {
    const { state, page } = req.query;

    if (!state) {
      return res.status(400).json({ message: 'State parameter is required' });
    }

    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
      console.error("SERPER_API_KEY is not defined in backend .env");
      return res.status(500).json({ message: 'Configure SERPER_API_KEY in the backend .env to enable Regional News', articles: [] });
    }

    const data = JSON.stringify({
      "q": `${state} news`,
      "gl": "in"
    });

    const config = {
      method: 'post',
      url: 'https://google.serper.dev/news',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      data: data,
      timeout: 10000
    };

    const response = await axios(config);

    if (response.data && response.data.news) {
      const uniqueResults = [];
      const acceptedTitles = [];

      // Strict regex matching for the selected state in TITLE ONLY
      const stateRegex = new RegExp(`\\b${state}\\b`, 'i');

      // Helper for fuzzy deduplication
      const calculateSimilarity = (str1, str2) => {
        const w1 = new Set(str1.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 3));
        const w2 = new Set(str2.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 3));

        let intersection = 0;
        for (let word of w1) {
          if (w2.has(word)) intersection++;
        }
        const union = w1.size + w2.size - intersection;
        return union === 0 ? 0 : intersection / union;
      };

      for (const article of response.data.news) {
        if (article.title) {
          const t = article.title;

          if (stateRegex.test(t)) {
            // Check against all previously accepted titles for high similarity (> 0.4 Jaccard)
            let isDuplicate = false;
            for (const existingTitle of acceptedTitles) {
              if (calculateSimilarity(t, existingTitle) > 0.4) {
                isDuplicate = true;
                break;
              }
            }

            if (!isDuplicate) {
              acceptedTitles.push(t);
              uniqueResults.push(article);
            }
          }
        }
      }

      // Map the external API format to our internal format
      const newsList = uniqueResults.slice(0, 20).map((article, index) => {
        let displayCategory = 'Regional';

        return {
          articleId: `region-${Date.now()}-${index}`,
          title: article.title || 'Untitled',
          category: displayCategory,
          shortDescription: article.snippet || 'No description available for this localized report.',
          content: article.snippet || 'No content available.',
          imageUrl: article.imageUrl || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=2071&auto=format&fit=crop',
          sourceUrl: article.link || '',
          date: new Date().toISOString().split('T')[0] // Serper dates are relative, using today's date
        };
      });

      // Upsert to DB to ensure detail pages and bookmarks persist
      const savedNewsPromises = newsList.map(async (newsObj) => {
        try {
          await Article.findOneAndUpdate(
            { articleId: newsObj.articleId },
            newsObj,
            { upsert: true, returnDocument: 'after' }
          );
        } catch (dbErr) {
          console.error('Error saving regional article to db:', dbErr);
        }
      });
      Promise.allSettled(savedNewsPromises);

      const formattedList = newsList.map(n => ({ ...n, id: n.articleId }));
      return res.json({
        articles: formattedList,
        nextPage: null
      });
    }

    throw new Error('Invalid format from live API');

  } catch (error) {
    console.error(`Error fetching regional news for ${req.query.state}:`, error.message);

    // Fallback: If live API fails, we could filter local news or just return an empty array gracefully
    res.status(500).json({
      message: 'Failed to fetch localized news from the provider. Please try again later.',
      articles: []
    });
  }
};

// @desc    Get real-time trending topics for India
// @route   GET /api/news/trending
// @access  Public
const getTrendingTopics = async (req, res) => {
  try {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Configure SERPER_API_KEY to enable Google Trending', trends: [] });
    }

    const data = JSON.stringify({
      "q": "top trending breaking news india",
      "gl": "in",
      "tbs": "qdr:d" // past 24 hours
    });

    const config = {
      method: 'post',
      url: 'https://google.serper.dev/news',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      data: data,
      timeout: 10000
    };

    const response = await axios(config);

    if (response.data && response.data.news) {
      // Deduplicate similar headlines
      const uniqueTrends = [];
      const seenWords = new Set();

      for (const article of response.data.news) {
        if (!article.title) continue;

        // Extract a "topic" core from the headline if possible (first 5 words)
        const titleWords = article.title.replace(/[^\w\s]/gi, '').split(/\s+/).slice(0, 5).join(' ');

        if (!seenWords.has(titleWords.toLowerCase()) && uniqueTrends.length < 10) {
          seenWords.add(titleWords.toLowerCase());

          uniqueTrends.push({
            id: `trend-${Date.now()}-${uniqueTrends.length}`,
            title: article.title,
            snippet: article.snippet || 'Click to view the live story.',
            url: article.link || '#'
          });
        }
      }

      return res.json({ trends: uniqueTrends });
    }

    res.json({ trends: [] });

  } catch (error) {
    console.error('Error fetching Serper Trends:', error);
    res.status(500).json({ message: 'Failed to fetch trending topics', trends: [] });
  }
};

// @desc    Search news by query
// @route   GET /api/news/search
// @access  Public
const searchNews = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
      console.error("SERPER_API_KEY is not defined in backend .env");
      return res.status(500).json({ message: 'Configure SERPER_API_KEY in the backend .env to enable Search', articles: [] });
    }

    const data = JSON.stringify({
      "q": `${q} news`,
      "gl": "in"
    });

    const config = {
      method: 'post',
      url: 'https://google.serper.dev/news',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      data: data,
      timeout: 10000
    };

    const response = await axios(config);

    if (response.data && response.data.news) {
      // Map the external API format to our internal format
      const newsList = response.data.news.slice(0, 20).map((article, index) => {
        return {
          articleId: `search-${Date.now()}-${index}`,
          title: article.title || 'Untitled',
          category: article.source || 'News Source',
          shortDescription: article.snippet || article.description || 'No description available.',
          content: article.snippet || article.description || 'No content available.',
          imageUrl: article.imageUrl || article.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop',
          sourceUrl: article.link || '',
          date: new Date().toISOString().split('T')[0] // Force valid ISO date to prevent "Invalid Date" in frontend
        };
      });

      // Upsert to DB to ensure detail pages and bookmarks persist
      const savedNewsPromises = newsList.map(async (newsObj) => {
        try {
          await Article.findOneAndUpdate(
            { articleId: newsObj.articleId },
            newsObj,
            { upsert: true, returnDocument: 'after' }
          );
        } catch (dbErr) {
          console.error('Error saving search article to db:', dbErr);
        }
      });
      Promise.allSettled(savedNewsPromises);

      const formattedList = newsList.map(n => ({ ...n, id: n.articleId }));
      return res.json({
        articles: formattedList,
        nextPage: null
      });
    }

    throw new Error('Invalid format from live API');

  } catch (error) {
    console.error(`Error searching news for ${req.query.q}:`, error.message);
    res.status(500).json({
      message: 'Failed to search news. Please try again later.',
      articles: []
    });
  }
};

module.exports = {
  getAllNews,
  getNewsById,
  getRegionalNews,
  getTrendingTopics,
  searchNews
};

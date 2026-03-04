const mongoose = require('mongoose');

const articleSchema = mongoose.Schema({
  articleId: {
    type: String,
    required: true,
    unique: true,
  },
  title: String,
  category: String,
  shortDescription: String,
  content: String,
  imageUrl: String,
  sourceUrl: String,
  date: String,
  globalViews: { type: Number, default: 0 },
  trendingScore: { type: Number, default: 0 }
}, {
  timestamps: true,
});

const Article = mongoose.model('Article', articleSchema);
module.exports = Article;

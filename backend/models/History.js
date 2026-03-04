const mongoose = require('mongoose');

const historySchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  articleId: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  // If no timestamp is provided, mongoose will default to current date
  timestamp: {
    type: Date,
    default: Date.now,
  },
  readingDurationSeconds: {
    type: Number,
    default: 0,
  },
  scrollDepthPercent: {
    type: Number,
    default: 0,
  }
}, {
  // Add timestamps just in case we need createdAt/updatedAt down the line
  timestamps: true,
});

const History = mongoose.model('History', historySchema);
module.exports = History;

const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false,
  },
  googleId: {
    type: String,
    default: null,
  },
  preferences: {
    type: [String],
    default: [],
  },
  bookmarkedArticles: {
    type: [String],
    default: [],
  },
  avatar: {
    type: String,
    default: '',
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  explicitPreferences: {
    type: [String],
    default: []
  },
  interactionCount: {
    type: Number,
    default: 0
  },
  categoryWeights: {
    type: Map,
    of: Number,
    default: {}
  }
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);
module.exports = User;

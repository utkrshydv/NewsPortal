const mongoose = require('mongoose');

const interactionSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  articleId: {
    type: String, // String to support both numeric and ObjectId based IDs historically stored
    required: true
  },
  category: {
    type: String,
    required: true
  },
  actionType: {
    type: String,
    enum: ['click', 'read', 'bookmark', 'share', 'dislike'],
    required: true
  },
  weight: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

const Interaction = mongoose.model('Interaction', interactionSchema);
module.exports = Interaction;

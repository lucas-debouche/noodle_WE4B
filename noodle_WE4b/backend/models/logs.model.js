const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  },
  action: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['user', 'forum', 'post', 'ue', 'system']
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['success', 'error', 'warning'],
    default: 'success'
  },
  responseTime: {
    type: Number
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
logSchema.index({ timestamp: -1 });
logSchema.index({ userId: 1, timestamp: -1 });
logSchema.index({ category: 1, timestamp: -1 });
logSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('Log', logSchema);

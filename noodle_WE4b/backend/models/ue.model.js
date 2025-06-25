const mongoose = require('mongoose');

const ueSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    trim: true
  },
  intitule: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: null
  },
  description: {
    type: String,
    required: false,
    trim: true
  },
  ects: {
    type: Number,
    required: true,
    min: 1,
    max: 30
  },
  departementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Departement',
    default: null
  },

  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    default: []
  }],

  semestre: {
    type: String,
    enum: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'],
    default: null
  },
  niveau: {
    type: String,
    enum: ['L1', 'L2', 'L3', 'M1', 'M2'],
    default: null
  },
  actif: {
    type: Boolean,
    default: true
  },
  maxParticipants: {
    type: Number,
    default: null // null = pas de limite
  }
}, {
  timestamps: true,
});


ueSchema.virtual('participantCount').get(function() {
  return this.participants ? this.participants.length : 0;
});


ueSchema.virtual('displayName').get(function() {
  return `${this.code} - ${this.intitule}`;
});


ueSchema.methods.addParticipant = function(userId) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
  }
  return this;
};


ueSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(id => !id.equals(userId));
  return this;
};

ueSchema.statics.findByCodeOrTitle = function(searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { code: regex },
      { intitule: regex }
    ]
  });
};

// Index pour améliorer les performances
ueSchema.index({ code: 1 });
ueSchema.index({ intitule: 1 });
ueSchema.index({ departementId: 1 });
ueSchema.index({ participants: 1 });
ueSchema.index({ ects: 1 });

ueSchema.index({ code: 'text', intitule: 'text', description: 'text' });

module.exports = mongoose.model('UE', ueSchema, 'ue');

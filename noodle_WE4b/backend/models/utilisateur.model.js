const mongoose = require('mongoose');

const utilisateurSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  prenom: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true
  },
  mot_passe: {
    type: String,
    required: true
  },
  photo: {
    type: String,
    default: null
  },
  role: {
    type: [String],
    required: true,
    enum: ['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN'],
    validate: {
      validator: function(arr) {
        return arr.length > 0;
      },
      message: 'Au moins un rôle est requis'
    }
  },
  ues: [{
    type: String, // Stockage sous forme de String pour flexibilité
    default: []
  }],
  telephone: {
    type: String,
    default: null
  },
  dateNaissance: {
    type: Date,
    default: null
  },
  adresse: {
    type: String,
    default: null
  },
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
});

// Index pour améliorer les performances
utilisateurSchema.index({ email: 1 });
utilisateurSchema.index({ nom: 1, prenom: 1 });
utilisateurSchema.index({ role: 1 });
utilisateurSchema.index({ ues: 1 });

module.exports = mongoose.model('Utilisateur', utilisateurSchema, 'utilisateur');

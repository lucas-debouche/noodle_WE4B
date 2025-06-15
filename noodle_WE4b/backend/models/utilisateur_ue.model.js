const mongoose = require('mongoose');

const utilisateurUeSchema = new mongoose.Schema({
  utilisateur_id: {
    type: String,
    required: true
  },
  ue_id: {
    type: String,
    required: true
  },
  // Métadonnées optionnelles pour l'inscription
  statut: {
    type: String,
    default: 'actif',
    enum: ['actif', 'inactif']
  },
  promotion: {
    type: String
  },
  specialite: {
    type: String
  },
  date_inscription: {
    type: Date,
    default: Date.now
  },
  note_finale: {
    type: Number
  },
  presence: {
    type: Number
  }
}, {
  timestamps: true
});

// Index composé pour éviter les doublons
utilisateurUeSchema.index({ utilisateur_id: 1, ue_id: 1 }, { unique: true });

module.exports = mongoose.model('UtilisateurUe', utilisateurUeSchema, 'utilisateur_ue');

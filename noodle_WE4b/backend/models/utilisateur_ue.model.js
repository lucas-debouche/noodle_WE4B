const mongoose = require('mongoose');

const utilisateurUeSchema = new mongoose.Schema({
  utilisateur_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  ue_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Ue', required: true }
});

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

module.exports = mongoose.model('UtilisateurUe', utilisateurUeSchema, 'utilisateur_ue');

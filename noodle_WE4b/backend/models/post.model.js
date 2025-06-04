const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  utilisateur_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Type', required: true },
  priorite_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Priorite',
    required: true,
  },
  ue_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UE', required: true },
  titre: { type: String, required: true },
  contenu: { type: String, required: true },
  fichier_nom: { type: String, default: null },
  fichier_type: { type: String, default: null },
  fichier_taille: { type: Number, default: null },
  date_publication: { type: Date, required: true },
  date_rendu: { type: Date, default: null },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Post', postSchema, 'post');

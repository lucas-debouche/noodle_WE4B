const mongoose = require('mongoose');

const renduSchema = new mongoose.Schema({
  utilisateur_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  fichier_nom: String,
  fichier_type: String,
  fichier_taille: Number,
  fichier_chemin: String,
  date_rendu: { type: Date, default: Date.now },
  note: { type: Number, min: 0, max: 20, default: null },
  etat_rendu: { type: String, enum: ['non rendu', 'en attente', 'corrigé'], default: 'non rendu' },
  commentaire: { type: String, default: '' },
}, { _id: false });

const postSchema = new mongoose.Schema({
  utilisateur_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Type', required: true },
  priorite_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Priorite', required: true },
  ue_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UE', required: true },
  titre: { type: String, required: true },
  contenu: { type: String, required: true },
  categorie: { type: String, enum: ['info', 'CM', 'TD', 'TP'], required: true },
  fichier_nom: { type: String, default: null },
  fichier_type: { type: String, default: null },
  fichier_taille: { type: Number, default: null },
  date_publication: { type: Date, required: true },
  date_rendu: { type: Date, default: null },
  faitPar: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' }],
  fichier_chemin: { type: String, default: null },
  rendus: [renduSchema]
}, {
  timestamps: true,
});

module.exports = mongoose.model('Post', postSchema, 'post');

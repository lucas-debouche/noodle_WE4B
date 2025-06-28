// ===========================================
// Import de Mongoose pour définir le modèle
// ===========================================
const mongoose = require('mongoose');

// =====================================================
// Schéma pour les rendus (travaux remis par les étudiants)
// =====================================================
const renduSchema = new mongoose.Schema({
  // Référence à l'utilisateur qui a déposé le rendu
  utilisateur_id: {
    type: mongoose.Schema.Types.ObjectId,          // Identifiant unique MongoDB
    ref: 'Utilisateur',                            // Référence au modèle Utilisateur
    required: true
  },
  fichier_nom: String,                             // Nom du fichier rendu
  fichier_type: String,                            // Type MIME du fichier
  fichier_taille: Number,                          // Taille du fichier en octets
  fichier_chemin: String,                          // Chemin de stockage sur le serveur
  date_rendu: { type: Date, default: Date.now },   // Date de dépôt du rendu
  note: { type: Number, min: 0, max: 20, default: null }, // Note attribuée (0-20)
  etat_rendu: {
    type: String,
    enum: ['non rendu', 'en attente', 'corrigé'],  // État du rendu possible
    default: 'non rendu'
  },
  commentaire: { type: String, default: '' },      // Commentaire du correcteur
}, { _id: false }); // Désactive l'auto-génération de _id pour chaque sous-document rendu

// ===========================================
// Schéma principal pour les posts
// ===========================================
const postSchema = new mongoose.Schema({
  // Référence à l'utilisateur qui a créé le post
  utilisateur_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  // Référence au type (ex: devoir, annonce, etc.)
  type_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Type',
    required: true
  },
  // Référence à la priorité du post
  priorite_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Priorite',
    required: true
  },
  // Référence à l'unité d'enseignement associée
  ue_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UE',
    required: true
  },
  titre: { type: String, required: true },          // Titre du post
  contenu: { type: String, required: true },        // Contenu textuel
  categorie: {
    type: String,
    enum: ['Informations', 'CM', 'TD', 'TP'],       // Catégorie du post
    required: true
  },
  fichier_nom: { type: String, default: null },     // Nom du fichier attaché
  fichier_type: { type: String, default: null },    // Type MIME du fichier attaché
  fichier_taille: { type: Number, default: null },  // Taille du fichier attaché
  date_publication: { type: Date, required: true }, // Date de publication du post
  date_rendu: { type: Date, default: null },        // Date limite de rendu (si devoir)
  faitPar: [{                                        // Liste des utilisateurs ayant traité ce post
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  }],
  fichier_chemin: { type: String, default: null },  // Chemin du fichier attaché sur le serveur
  rendus: [renduSchema]                             // Liste des rendus déposés pour ce post
}, {
  timestamps: true,  // Ajoute automatiquement createdAt et updatedAt
});

// ===========================================
// Export du modèle Post
// ===========================================
// 3ème argument 'post' = nom explicite de la collection
module.exports = mongoose.model('Post', postSchema, 'post');

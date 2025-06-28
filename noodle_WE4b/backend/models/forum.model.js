// On importe Mongoose pour gérer les schémas et les modèles MongoDB
const mongoose = require('mongoose');
const { Schema } = mongoose; // On extrait la classe Schema pour définir nos structures

// ===============================
// Schéma pour les pièces jointes
// ===============================
const attachmentSchema = new Schema({
  filename: { type: String, required: true },      // Nom du fichier enregistré sur le serveur
  originalName: { type: String, required: true },  // Nom original du fichier téléchargé par l'utilisateur
  mimeType: { type: String, required: true },      // Type MIME (ex : image/png, application/pdf, etc.)
  size: { type: Number, required: true },          // Taille du fichier en octets
  uploadedAt: { type: Date, default: Date.now }    // Date d'upload, valeur par défaut : date actuelle
});

// ===============================
// Schéma pour les réponses aux messages
// ===============================
const replySchema = new Schema({
  userId: { type: String },                        // ID de l'utilisateur qui a posté la réponse
  message: { type: String, required: true },       // Contenu textuel de la réponse
  createdAt: { type: Date, default: Date.now },    // Date de création de la réponse
  updatedAt: { type: Date },                       // Date de dernière modification (si la réponse est éditée)
  isEdited: { type: Boolean, default: false },     // Indique si la réponse a été modifiée après publication
  attachments: [attachmentSchema]                  // Tableau de pièces jointes liées à la réponse
});

// ===============================
// Schéma pour les messages du forum
// ===============================
const messageSchema = new Schema({
  userId: { type: String },                        // ID de l'utilisateur qui a posté le message
  message: { type: String, required: true },       // Contenu textuel du message
  createdAt: { type: Date, default: Date.now },    // Date de création du message
  updatedAt: { type: Date },                       // Date de dernière modification (si le message est édité)
  isEdited: { type: Boolean, default: false },     // Indique si le message a été modifié après publication
  replies: [replySchema],                          // Liste des réponses associées à ce message
  attachments: [attachmentSchema]                  // Liste des pièces jointes pour ce message
});

// ===============================
// Schéma principal pour le forum
// ===============================
const forumSchema = new Schema({
  ueId: { type: String, required: true },          // ID de l'unité d'enseignement liée au forum
  title: { type: String, required: true },         // Titre du forum
  creatorId: { type: String },                     // ID du créateur du forum
  createdAt: { type: Date, default: Date.now },    // Date de création du forum
  updatedAt: { type: Date },                       // Date de dernière modification du forum
  messages: [messageSchema]                        // Liste des messages publiés dans le forum
});

// ===============================
// Export du modèle Forum
// ===============================
// On enregistre le schéma sous forme de modèle Mongoose pour pouvoir l'utiliser dans l'application
module.exports = mongoose.model('Forum', forumSchema);

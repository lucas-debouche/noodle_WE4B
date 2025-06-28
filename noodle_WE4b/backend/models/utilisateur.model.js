// ===========================================
// Import de Mongoose pour gérer le modèle
// ===========================================
const mongoose = require('mongoose');

// ===========================================
// Schéma principal pour un Utilisateur
// ===========================================
const utilisateurSchema = new mongoose.Schema({
  // Nom de famille de l'utilisateur
  nom: {
    type: String,
    required: true,  // Champ obligatoire
    trim: true       // Supprime les espaces inutiles en début/fin
  },
  // Prénom de l'utilisateur
  prenom: {
    type: String,
    required: true,  // Champ obligatoire
    trim: true
  },
  // Adresse email unique (toujours en minuscule)
  email: {
    type: String,
    unique: true,    // Doit être unique
    required: true,  // Champ obligatoire
    lowercase: true, // Convertit automatiquement en minuscules
    trim: true
  },
  // Mot de passe (hashé en pratique)
  mot_passe: {
    type: String,
    required: true   // Champ obligatoire
  },
  // Photo de profil (URL ou chemin)
  photo: {
    type: String,
    default: null    // Peut être nul si pas de photo
  },
  // Rôles de l'utilisateur (peut être multiple)
  role: {
    type: [String],  // Tableau de rôles
    required: true,  // Au moins un rôle doit être défini
    enum: ['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN'], // Liste des rôles autorisés
    validate: {
      // Validation personnalisée : tableau non vide
      validator: function(arr) {
        return arr.length > 0;
      },
      message: 'Au moins un rôle est requis'
    }
  },
  // Liste des UE liées (stockées sous forme de chaînes)
  ues: [{
    type: String,    // Flexibilité pour stocker le code de l'UE
    default: []      // Par défaut : liste vide
  }],
  // Numéro de téléphone (facultatif)
  telephone: {
    type: String,
    default: null
  },
  // Date de naissance (facultatif)
  dateNaissance: {
    type: Date,
    default: null
  },
  // Adresse postale (facultatif)
  adresse: {
    type: String,
    default: null
  },
  // Statut actif ou non
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Ajoute automatiquement createdAt et updatedAt
});

// ===========================================
// Index pour améliorer les performances
// ===========================================
// Index sur l'email pour recherche rapide (et garantir unicité)
utilisateurSchema.index({ email: 1 });

// Index combiné nom + prénom pour faciliter les recherches par nom complet
utilisateurSchema.index({ nom: 1, prenom: 1 });

// Index sur le rôle pour filtrer rapidement par rôle
utilisateurSchema.index({ role: 1 });

// Index sur les UE pour filtrer les utilisateurs inscrits à une UE
utilisateurSchema.index({ ues: 1 });

// ===========================================
// Export du modèle Utilisateur
// ===========================================
module.exports = mongoose.model('Utilisateur', utilisateurSchema, 'utilisateur');

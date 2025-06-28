// ===========================================
// Import de Mongoose pour définir le modèle
// ===========================================
const mongoose = require('mongoose');

// ===========================================
// Schéma principal pour une UE (Unité d’Enseignement)
// ===========================================
const ueSchema = new mongoose.Schema({
  // Code unique de l'UE (ex: INFO101)
  code: {
    type: String,
    unique: true,              // Doit être unique dans la collection
    required: true,            // Champ obligatoire
    uppercase: true,           // Transforme en majuscules automatiquement
    trim: true                 // Supprime les espaces en début/fin
  },
  // Intitulé de l'UE (ex: "Programmation avancée")
  intitule: {
    type: String,
    required: true,            // Champ obligatoire
    trim: true                 // Nettoie les espaces
  },
  // URL ou chemin de l'image associée (ex: logo UE)
  image: {
    type: String,
    default: null              // Peut être nul si non renseigné
  },
  // Description textuelle de l'UE
  description: {
    type: String,
    required: false,           // Champ facultatif
    trim: true
  },
  // Nombre de crédits ECTS (entre 1 et 30)
  ects: {
    type: Number,
    required: true,
    min: 1,                    // Minimum 1 crédit
    max: 30                    // Maximum 30 crédits
  },
  // Référence au département auquel l'UE est rattachée
  departementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Departement',
    default: null              // Peut être nul si pas de département
  },

  // Liste des participants inscrits à l'UE (références aux utilisateurs)
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    default: []                // Par défaut : liste vide
  }],

  // Semestre auquel appartient l’UE
  semestre: {
    type: String,
    enum: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'], // Liste des valeurs autorisées
    default: null
  },
  // Niveau d'étude (Licence/Master)
  niveau: {
    type: String,
    enum: ['L1', 'L2', 'L3', 'M1', 'M2'],         // Liste des valeurs autorisées
    default: null
  },
  // Indique si l’UE est active
  actif: {
    type: Boolean,
    default: true
  },
  // Nombre max de participants autorisés (null = pas de limite)
  maxParticipants: {
    type: Number,
    default: null
  }
}, {
  timestamps: true, // Ajoute createdAt et updatedAt automatiquement
});

// ===========================================
// Virtual : nombre de participants
// ===========================================
ueSchema.virtual('participantCount').get(function() {
  // Calcule le nombre de participants dynamiquement
  return this.participants ? this.participants.length : 0;
});

// ===========================================
// Virtual : affichage formaté (code + intitulé)
// ===========================================
ueSchema.virtual('displayName').get(function() {
  return `${this.code} - ${this.intitule}`;
});

// ===========================================
// Méthode d'instance : ajouter un participant
// ===========================================
ueSchema.methods.addParticipant = function(userId) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
  }
  return this;
};

// ===========================================
// Méthode d'instance : retirer un participant
// ===========================================
ueSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(id => !id.equals(userId));
  return this;
};

// ===========================================
// Méthode statique : rechercher par code ou intitulé
// ===========================================
ueSchema.statics.findByCodeOrTitle = function(searchTerm) {
  const regex = new RegExp(searchTerm, 'i'); // Recherche insensible à la casse
  return this.find({
    $or: [
      { code: regex },
      { intitule: regex }
    ]
  });
};

// ===========================================
// Index pour optimiser les recherches
// ===========================================
// Index unique pour le code
ueSchema.index({ code: 1 });
// Index sur l’intitulé
ueSchema.index({ intitule: 1 });
// Index sur le département
ueSchema.index({ departementId: 1 });
// Index sur les participants
ueSchema.index({ participants: 1 });
// Index sur les ECTS
ueSchema.index({ ects: 1 });

// Index textuel pour recherche plein texte
ueSchema.index({ code: 'text', intitule: 'text', description: 'text' });

// ===========================================
// Export du modèle UE
// ===========================================
module.exports = mongoose.model('UE', ueSchema, 'ue');

const mongoose = require('mongoose');

// Schéma pour les départements
const departementSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  code: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: 10
  },
  responsable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  },
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'departement'
});

// Index pour optimiser les recherches
departementSchema.index({ nom: 1 });
departementSchema.index({ code: 1 });
departementSchema.index({ actif: 1 });

// Méthodes du schéma
departementSchema.methods.toJSON = function() {
  const departement = this.toObject();

  return {
    id: departement._id.toString(),
    nom: departement.nom,
    description: departement.description,
    code: departement.code,
    responsable: departement.responsable,
    actif: departement.actif,
    createdAt: departement.createdAt,
    updatedAt: departement.updatedAt
  };
};

// Middleware pre-save pour validation
departementSchema.pre('save', function(next) {
  // Vérifier l'unicité du nom
  if (this.isModified('nom')) {
    this.constructor.findOne({
      nom: this.nom,
      _id: { $ne: this._id }
    }, (err, existingDept) => {
      if (err) return next(err);
      if (existingDept) {
        return next(new Error('Un département avec ce nom existe déjà'));
      }
      next();
    });
  } else {
    next();
  }
});

// Méthodes statiques
departementSchema.statics.findActifs = function() {
  return this.find({ actif: true }).sort({ nom: 1 });
};

departementSchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase() });
};

const Departement = mongoose.model('Departement', departementSchema);

module.exports = Departement;

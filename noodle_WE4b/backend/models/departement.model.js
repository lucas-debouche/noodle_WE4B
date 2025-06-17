const mongoose = require('mongoose');
const { Schema } = mongoose;

const departementSchema = new Schema({
  nom: { type: String, required: true },
  code: { type: String, unique: true, required: true },
  description: { type: String, required: true },
  responsableId: { type: String, required: true }, // ID de l'utilisateur responsable du département
  dateCreation: { type: Date, default: Date.now },
  dateModification: { type: Date }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Departement', departementSchema, 'departement');

const mongoose = require('mongoose');

const utilisateurSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  mot_passe: { type: String, required: true },
  photo: { type: String },
  role: { type: [String], required: true },
});

module.exports = mongoose.model('Utilisateur', utilisateurSchema, 'utilisateur');

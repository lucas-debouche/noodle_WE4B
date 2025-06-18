const mongoose = require('mongoose');

const utilisateurUeSchema = new mongoose.Schema({
  utilisateur_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  ue_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Ue', required: true }
});

module.exports = mongoose.model('UtilisateurUe', utilisateurUeSchema, 'utilisateur_ue');

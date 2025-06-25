const mongoose = require('mongoose');

const ueSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  intitule: { type: String, required: true },
  image: { type: String, default: null },
  description: { type: String, required: false },
  ects: { type: Number, required: true },
  departementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Departement',
    default: null
  },
  participants: [{ type: String }] // Array d'IDs d'utilisateurs
}, {
  timestamps: true,
});

module.exports = mongoose.model('UE', ueSchema, 'ue');

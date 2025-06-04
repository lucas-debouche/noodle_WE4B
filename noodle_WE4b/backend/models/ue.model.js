const mongoose = require('mongoose');

const ueSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  intitule: { type: String, required: true },
  image: { type: String, default: null },
  description: { type: String, required: true },
  ects: { type: Number, required: true },
}, {
  timestamps: true,
});

module.exports = mongoose.model('UE', ueSchema, 'ue');

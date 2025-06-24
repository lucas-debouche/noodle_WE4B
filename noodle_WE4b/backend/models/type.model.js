const mongoose = require('mongoose');

const typeSchema = new mongoose.Schema({
  nom: { type: String, required: true }
});

module.exports = mongoose.model('Type', typeSchema, 'type');

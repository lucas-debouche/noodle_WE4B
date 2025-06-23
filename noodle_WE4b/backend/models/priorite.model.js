const mongoose = require('mongoose');

const prioriteSchema = new mongoose.Schema({
  nom: { type: String, required: true }
});

module.exports = mongoose.model('Priorite', prioriteSchema, 'priorite');

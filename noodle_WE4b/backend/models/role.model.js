const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  id: { type: String, required: true },
  nom: { type: String, required: true }
});

module.exports = mongoose.model('Role', RoleSchema, 'role');

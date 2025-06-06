const express = require('express');
const router = express.Router();
const Utilisateur = require('../models/utilisateur.model');

// Obtenir tous les utilisateurs
router.get('/', async (req, res) => {
  try {
    const utilisateurs = await Utilisateur.find();
    res.json(utilisateurs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Ue = require('../models/ue.model');
const Utilisateur = require('../models/utilisateur.model');

// Route pour obtenir toutes les UEs et tous les utilisateurs
router.get('/panel-data', async (req, res) => {
  try {
    const ues = await Ue.find();
    const users = await Utilisateur.find();
    res.json({ ues, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

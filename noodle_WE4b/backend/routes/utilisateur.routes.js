const express = require('express');
const router = express.Router();
const Utilisateur = require('../models/utilisateur.model');

// Obtenir tous les utilisateurs
router.get('/', async (req, res) => {
  try {
    const utilisateurs = await Utilisateur.find();
    if (utilisateurs.length === 0) {
      return res.status(404).json({ error: 'Aucun utilisateur trouvé.' });
    }
    res.json(utilisateurs);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs.' });
  }
});

module.exports = router;

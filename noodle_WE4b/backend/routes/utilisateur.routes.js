const express = require('express');
const router = express.Router();
const Utilisateur = require('../models/utilisateur.model');
const bcrypt = require('bcrypt');

// Obtenir tous les utilisateurs
router.get('/', async (req, res) => {
  try {
    const utilisateurs = await Utilisateur.find();
    res.json(utilisateurs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Route de connexion (auth)
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Utilisateur.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const match = await bcrypt.compare(password, user.mot_passe);
    if (!match) return res.status(401).json({ error: 'Mot de passe incorrect' });

    res.json(user); // Ou envoyer un JWT ici
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

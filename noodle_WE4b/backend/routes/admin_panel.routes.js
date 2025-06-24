const express = require('express');
const router = express.Router();
const Ue = require('../models/ue.model');
const Utilisateur = require('../models/utilisateur.model');
const authMiddleware = require("../security/middleware_auth");

// Route pour obtenir toutes les UEs et tous les utilisateurs
router.get('/panel_data', authMiddleware(['ROLE_ADMIN']), async (req, res) => {
  try {
    const ues = await Ue.find();
    const users = await Utilisateur.find();
    res.json({ ues, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Supprimer une UE
router.delete('/ue/:id', authMiddleware(['ROLE_ADMIN']), async (req, res) => {
  try {
    await Ue.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Supprimer un utilisateur
router.delete('/user/:id', authMiddleware(['ROLE_ADMIN']), async (req, res) => {
  try {
    await Utilisateur.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

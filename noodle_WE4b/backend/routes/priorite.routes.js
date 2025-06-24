const express = require('express');
const router = express.Router();
const Priorite = require('../models/priorite.model');
const authMiddleware = require("../security/middleware_auth");

// Retourne toutes les priorités
router.get('/', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), async (req, res) => {
  try {
    const priorites = await Priorite.find();
    res.json(priorites);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des priorités.' });
  }
});

// Retourne une priorité par ID
router.get('/:id', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), async (req, res) => {
  try {
    const priorite = await Priorite.findById(req.params.id);
    if (!priorite) {
      return res.status(404).json({ message: 'Priorité non trouvée' });
    }
    res.json(priorite);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération de la priorité.' });
  }
});

module.exports = router;

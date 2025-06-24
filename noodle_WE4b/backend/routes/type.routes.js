const express = require('express');
const router = express.Router();
const Type = require('../models/type.model');
const authMiddleware = require("../security/middleware_auth");

// Retourne toutes les priorités
router.get('/', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), async (req, res) => {
  try {
    const types = await Type.find();
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des types.' });
  }
});

// Retourne un type par ID
router.get('/:id', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), async (req, res) => {
  try {
    const type = await Type.findById(req.params.id);
    if (!type) {
      return res.status(404).json({ message: 'Type not found' });
    }
    res.json(type);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération du type.' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Role = require('../models/role.model');

// GET /api/roles - retourne tous les rôles
router.get('/', async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des rôles.' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Ue = require('../models/ue.model');

// Obtenir tous les utilisateurs
router.get('/', async (req, res) => {
  try {
    const ue = await Ue.find();
    res.json(ue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

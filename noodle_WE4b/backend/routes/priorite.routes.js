const express = require('express');
const router = express.Router();
const Priorite = require('../models/priorite.model');

// Retourne toutes les priorités
router.get('/', async (req, res) => {
  try {
    const priorites = await Priorite.find();
    res.json(priorites);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des priorités.' });
  }
});

module.exports = router;

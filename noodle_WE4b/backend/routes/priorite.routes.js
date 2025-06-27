const express = require('express');
const router = express.Router();
const Priorite = require('../models/priorite.model');
const authMiddleware = require("../security/middleware_auth");
const { logAction } = require('../utils/logActions');

// Retourne toutes les priorités
router.get('/', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), async (req, res) => {
  try {
    const priorites = await Priorite.find();

    // Log the action
    await logAction({
      action: 'get_all_priorites',
      category: 'priorite',
      userId: req.user ? req.user.userId : null,
      details: { success: true }
    });

    res.json(priorites);
  } catch (err) {
    console.error('Erreur lors de la récupération des priorités:', err);
    await logAction({
      action: 'error_get_priorites',
      category: 'priorite',
      userId: req.user ? req.user.userId : null,
      details: { error: err.message }
    });
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

    // Log the action
    await logAction({
      action: 'get_priorite_by_id',
      category: 'priorite',
      userId: req.user ? req.user.userId : null,
      targetId: req.params.id,
      details: { success: true }
    });

    res.json(priorite);
  } catch (err) {
    console.error('Erreur lors de la récupération de la priorité:', err);
    await logAction({
      action: 'error_get_priorite',
      category: 'priorite',
      userId: req.user ? req.user.userId : null,
      targetId: req.params.id,
      details: { error: err.message }
    });
    res.status(500).json({ error: 'Erreur lors de la récupération de la priorité.' });
  }
});

module.exports = router;

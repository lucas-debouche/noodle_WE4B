const express = require('express');
const router = express.Router();
const Type = require('../models/type.model');
const authMiddleware = require("../security/middleware_auth");
const { logAction } = require('../utils/logActions');

// Retourne toutes les priorités
router.get('/', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), async (req, res) => {
  try {
    const types = await Type.find();
    await logAction({
      action: 'get_all_types',
      category: 'type',
      userId: req.user ? req.user.userId : null,
      details: { success: true }
    });
    res.json(types);
  } catch (err) {
    await logAction({
      action: 'error_get_types',
      category: 'type',
      userId: req.user ? req.user.userId : null,
      details: { error: err.message }
    });
    res.status(500).json({ error: 'Erreur lors de la récupération des types.' });
  }
});

// Retourne un type par ID
router.get('/:id', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), async (req, res) => {
  try {
    const type = await Type.findById(req.params.id);
    if (!type) {
      await logAction({
        action: 'error_get_type',
        category: 'type',
        userId: req.user ? req.user.userId : null,
        targetId: req.params.id,
        details: { error: 'Type not found' }
      });
      return res.status(404).json({ message: 'Type not found' });
    }
    await logAction({
      action: 'get_type_by_id',
      category: 'type',
      userId: req.user ? req.user.userId : null,
      targetId: req.params.id,
      details: { success: true }
    });
    res.json(type);
  } catch (err) {
    await logAction({
      action: 'error_get_type',
      category: 'type',
      userId: req.user ? req.user.userId : null,
      targetId: req.params.id,
      details: { error: err.message }
    });
    res.status(500).json({ error: 'Erreur lors de la récupération du type.' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Role = require('../models/role.model');
const { logAction } = require('../utils/logActions');

// GET /api/roles - retourne tous les rôles
router.get('/', async (req, res) => {
  try {
    console.log("Récupération de tous les rôles...");
    const roles = await Role.find();
    await logAction({
      action: 'get_all_roles',
      category: 'role',
      userId: req.user ? req.user.userId : null,
      details: { success: true }
    });
    res.json(roles);
  } catch (err) {
    await logAction({
      action: 'error_get_roles',
      category: 'role',
      userId: req.user ? req.user.userId : null,
      details: { error: err.message }
    });
    res.status(500).json({ error: 'Erreur lors de la récupération des rôles.' });
  }
});

module.exports = router;

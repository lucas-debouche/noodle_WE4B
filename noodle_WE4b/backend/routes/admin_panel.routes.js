const express = require('express');
const router = express.Router();
const Ue = require('../models/ue.model');
const Utilisateur = require('../models/utilisateur.model');
const authMiddleware = require("../security/middleware_auth");
const { logAction } = require('../utils/logActions');


// Route pour obtenir toutes les UEs et tous les utilisateurs
router.get('/panel_data', authMiddleware(['ROLE_ADMIN']), async (req, res) => {
  try {
    const ues = await Ue.find();
    const users = await Utilisateur.find();
    await logAction({
      action: 'get_panel_data',
      category: 'admin_panel',
      userId: req.user ? req.user.userId : null,
      details: { success: true, uesCount: ues.length, usersCount: users.length }
    });
    res.json({ ues, users });
  } catch (err) {
    await logAction({
      action: 'error_get_panel_data',
      category: 'admin_panel',
      userId: req.user ? req.user.userId : null,
      details: { error: err.message }
    });
    res.status(500).json({ error: err.message });
  }
});

// Supprimer une UE
router.delete('/ue/:id', authMiddleware(['ROLE_ADMIN']), async (req, res) => {
  try {
    await Ue.findByIdAndDelete(req.params.id);
    await logAction({
      action: 'delete_ue',
      category: 'admin_panel',
      userId: req.user ? req.user.userId : null,
      targetId: req.params.id,
      details: { success: true }
    });
    res.json({ success: true });
  } catch (err) {
    await logAction({
      action: 'error_delete_ue',
      category: 'admin_panel',
      userId: req.user ? req.user.userId : null,
      targetId: req.params.id,
      details: { error: err.message }
    });
    res.status(500).json({ error: err.message });
  }
});

// Supprimer un utilisateur
router.delete('/user/:id', authMiddleware(['ROLE_ADMIN']), async (req, res) => {
  try {
    await Utilisateur.findByIdAndDelete(req.params.id);
    await logAction({
      action: 'delete_user',
      category: 'admin_panel',
      userId: req.user ? req.user.userId : null,
      targetId: req.params.id,
      details: { success: true }
    });
    res.json({ success: true });
  } catch (err) {
    await logAction({
      action: 'error_delete_user',
      category: 'admin_panel',
      userId: req.user ? req.user.userId : null,
      targetId: req.params.id,
      details: { error: err.message }
    });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

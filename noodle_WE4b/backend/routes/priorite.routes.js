// ===============================================
// Dépendances principales
// ===============================================
const express = require('express');
const router = express.Router();
const Priorite = require('../models/priorite.model'); // Modèle Priorité
const authMiddleware = require("../security/middleware_auth"); // Middleware d'authentification
const { logAction } = require('../utils/logActions'); // Fonction pour enregistrer des logs

// ===============================================
// ROUTE : Obtenir toutes les priorités
// ===============================================
router.get(
  '/',
  authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), // Protection : seuls les rôles autorisés
  async (req, res) => {
    try {
      // Récupère toutes les priorités en base
      const priorites = await Priorite.find();

      // Journalise l'action réussie
      await logAction({
        action: 'get_all_priorites',
        category: 'priorite',
        userId: req.user ? req.user.userId : null,
        details: { success: true }
      });

      res.json(priorites);
    } catch (err) {
      console.error('Erreur lors de la récupération des priorités:', err);

      // Journalise l'erreur
      await logAction({
        action: 'error_get_priorites',
        category: 'priorite',
        userId: req.user ? req.user.userId : null,
        details: { error: err.message }
      });

      res.status(500).json({ error: 'Erreur lors de la récupération des priorités.' });
    }
  }
);

// ===============================================
// ROUTE : Obtenir une priorité spécifique par ID
// ===============================================
router.get(
  '/:id',
  authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), // Protection
  async (req, res) => {
    try {
      // Cherche la priorité par son ID MongoDB
      const priorite = await Priorite.findById(req.params.id);

      if (!priorite) {
        // Si non trouvée : 404
        return res.status(404).json({ message: 'Priorité non trouvée' });
      }

      // Journalise l'action réussie
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

      // Journalise l'erreur
      await logAction({
        action: 'error_get_priorite',
        category: 'priorite',
        userId: req.user ? req.user.userId : null,
        targetId: req.params.id,
        details: { error: err.message }
      });

      res.status(500).json({ error: 'Erreur lors de la récupération de la priorité.' });
    }
  }
);

// ===============================================
// Export du router pour utilisation dans l'app
// ===============================================
module.exports = router;

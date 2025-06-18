const express = require('express');
const router = express.Router();
const ueController = require('../controllers/ue.controller');
const authMiddleware = require('../security/middleware_auth');

// ===================================
// ROUTES PUBLIQUES (sans authentification)
// ===================================

// Routes spécifiques AVANT les routes avec paramètres
router.get('/search', ueController.searchUes);

// Route générale
router.get('/', ueController.getAllUes);

// ===================================
// ROUTES PROTÉGÉES ADMIN UNIQUEMENT
// ===================================

// Création d'une UE
router.post('/',
  authMiddleware(['ROLE_ADMIN']),
  ueController.createUe
);

// ===================================
// ROUTES AVEC PARAMÈTRES
// ===================================

// Routes spécifiques avec paramètres AVANT les routes génériques
router.get('/:ueId/participants/stats', ueController.getParticipantsStats);
router.get('/:ueId/participants', ueController.getParticipantsByUe);

// Gestion des participants (PROF + ADMIN)
router.post('/:ueId/participants',
  authMiddleware(['ROLE_PROF', 'ROLE_ADMIN']),
  ueController.addParticipantToUe
);

router.delete('/:ueId/participants/:utilisateurId',
  authMiddleware(['ROLE_PROF', 'ROLE_ADMIN']),
  ueController.removeParticipantFromUe
);

// Routes générales avec paramètre (APRÈS les routes spécifiques)
router.get('/:ueId', ueController.getUeById);

// Modification/suppression (ADMIN uniquement)
router.put('/:ueId',
  authMiddleware(['ROLE_ADMIN']),
  ueController.updateUe
);

router.delete('/:ueId',
  authMiddleware(['ROLE_ADMIN']),
  ueController.deleteUe
);

module.exports = router;

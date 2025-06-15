const express = require('express');
const router = express.Router();
const forumsController = require('../controllers/forums.controller');
const authMiddleware = require('../security/middleware_auth');

// Créer un nouveau sujet → protégée par authMiddleware
router.post(
  '/',
  authMiddleware(['ROLE_PROF', 'ROLE_ADMIN', 'ROLE_USER']),
  forumsController.createForum
);

// Obtenir les forums d'un cours précis (non protégé — lecture publique)
router.get('/:ueId', forumsController.getForumsByUe);

// Obtenir les détails d'un forum précis (non protégé — lecture publique)
router.get('/detail/:forumId', forumsController.getForumDetail);

// Ajouter un message à un sujet existant → protégée par authMiddleware
router.post(
  '/:forumId/messages',
  authMiddleware(['ROLE_PROF', 'ROLE_ADMIN', 'ROLE_USER']),
  forumsController.addMessage
);

module.exports = router;

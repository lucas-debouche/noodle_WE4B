const express = require('express');
const router = express.Router();
const forumsController = require('../controllers/forums.controller');
const authMiddleware = require('../security/middleware_auth');

// ✅ IMPORTANT: Routes spécifiques AVANT les routes avec paramètres

// Routes spécifiques (sans paramètres) - DOIVENT être en premier
router.get('/download/:filename', forumsController.downloadFile);

// Routes avec paramètres spécifiques - AVANT les routes génériques
router.get('/detail/:forumId', forumsController.getForumDetail);

// Routes pour ROLE_USER, ROLE_PROF, ROLE_ADMIN
router.post(
  '/',
  authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']),
  forumsController.createForum
);

// Routes avec paramètres - messages
router.post(
  '/:forumId/messages',
  authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']),
  forumsController.addMessage
);

// Routes avec paramètres - réponses (plus spécifiques)
router.post(
  '/:forumId/messages/:messageId/replies',
  authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']),
  forumsController.addReply
);

// Routes PUT - modification
router.put(
  '/:forumId/title',
  authMiddleware(['ROLE_PROF', 'ROLE_ADMIN']),
  forumsController.updateForumTitle
);

router.put(
  '/:forumId/messages/:messageId',
  authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']),
  forumsController.updateMessage
);

router.put(
  '/:forumId/messages/:messageId/replies/:replyId',
  authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']),
  forumsController.updateReply
);

// Routes DELETE - suppression
router.delete(
  '/:forumId/messages/:messageId/replies/:replyId',
  authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']),
  forumsController.deleteReply
);

router.delete(
  '/:forumId/messages/:messageId',
  authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']),
  forumsController.deleteMessage
);

// Route DELETE forum (ADMIN uniquement)
router.delete(
  '/:forumId',
  authMiddleware(['ROLE_ADMIN']),
  forumsController.deleteForum
);

// ✅ Route générale avec paramètre - DOIT être en dernier
router.get('/:ueId', forumsController.getForumsByUe);

module.exports = router;

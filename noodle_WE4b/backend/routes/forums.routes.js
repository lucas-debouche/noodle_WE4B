const express = require('express');
const router = express.Router();
const forumsController = require('../controllers/forums.controller');
const authMiddleware = require('../security/middleware_auth');

// Routes publiques (lecture)
router.get('/:ueId', forumsController.getForumsByUe);
router.get('/detail/:forumId', forumsController.getForumDetail);

// Route pour télécharger les fichiers
router.get('/download/:filename', forumsController.downloadFile);

// Routes pour ROLE_USER, ROLE_PROF, ROLE_ADMIN
router.post(
  '/',
  authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']),
  forumsController.createForum
);

// Route pour ajouter un message avec fichiers
router.post(
  '/:forumId/messages',
  authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']),
  forumsController.addMessage
);

// Route pour ajouter une réponse avec fichiers
router.post(
  '/:forumId/messages/:messageId/replies',
  authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']),
  forumsController.addReply
);

// Routes pour ROLE_PROF et ROLE_ADMIN uniquement
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
router.delete(
  '/:forumId/messages/:messageId',
  authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']),
  forumsController.deleteMessage
);

router.delete(
  '/:forumId/messages/:messageId/replies/:replyId',
  authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']),
  forumsController.deleteReply
);

// Routes pour ROLE_ADMIN uniquement
router.delete(
  '/:forumId',
  authMiddleware(['ROLE_ADMIN']),
  forumsController.deleteForum
);

module.exports = router;

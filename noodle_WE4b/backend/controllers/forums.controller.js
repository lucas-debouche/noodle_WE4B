const { ObjectId } = require('mongodb');
const Forum = require('../models/forum.model');
const { logAction } = require("../utils/logActions");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration Multer pour les fichiers de forum
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/forums');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'forum-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Types de fichiers autorisés (vous pouvez ajuster selon vos besoins)
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-rar-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// GET /api/forums/:ueId → récupérer les forums par ueId
exports.getForumsByUe = async (req, res) => {
  const ueIdParam = req.params.ueId;
  console.log(`forums.controller.js → getForumsByUe | ueId = ${ueIdParam}`);

  try {
    let forums = await Forum.find({ ueId: ueIdParam });

    if (forums.length === 0 && ObjectId.isValid(ueIdParam)) {
      forums = await Forum.find({ ueId: new ObjectId(ueIdParam) });
    }

    res.json(forums);
  } catch (err) {
    console.error('Error in getForumsByUe:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /api/forums → créer un nouveau forum (ROLE_USER, ROLE_PROF, ROLE_ADMIN)
exports.createForum = async (req, res) => {
  console.log('createForum → req.user =', req.user);

  const { ueId, title } = req.body;
  const newForum = new Forum({
    ueId: ueId,
    title: title,
    creatorId: req.user ? req.user.userId : null,
    createdAt: new Date(),
    messages: []
  });

  try {
    const savedForum = await newForum.save();

    await logAction({
      action: 'create_forum',
      category: 'forum',
      userId: req.user.userId,
      targetId: savedForum._id.toString(),
      details: { ueId, title }
    });

    res.status(201).json(savedForum);
  } catch (err) {
    console.error('Error in createForum:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/forums/detail/:forumId → détail d'un forum
exports.getForumDetail = async (req, res) => {
  const forumId = req.params.forumId;
  console.log(`forums.controller.js → getForumDetail | forumId = ${forumId}`);

  try {
    const forum = await Forum.findById(forumId);
    if (!forum) {
      return res.status(404).json({ message: 'Forum non trouvé' });
    }
    res.json(forum);
  } catch (err) {
    console.error('Error in getForumDetail:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /api/forums/:forumId/messages → ajouter un message avec fichiers (ROLE_USER, ROLE_PROF, ROLE_ADMIN)
exports.addMessage = [
  upload.array('attachments', 5), // Maximum 5 fichiers
  async (req, res) => {
    const forumId = req.params.forumId;

    // Avec multer et FormData, les données sont dans req.body mais peuvent être undefined
    const message = req.body.message || '';

    console.log(`forums.controller.js → addMessage | forumId = ${forumId}, message = "${message}"`);
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);

    // Vérifier que le message n'est pas vide
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Le message ne peut pas être vide' });
    }

    try {
      const forum = await Forum.findById(forumId);
      if (!forum) {
        return res.status(404).json({ message: 'Forum non trouvé' });
      }

      // Traitement des fichiers attachés
      const attachments = [];
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          attachments.push({
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            uploadedAt: new Date()
          });
        });
      }

      const newMessage = {
        _id: new ObjectId(),
        userId: req.user ? req.user.userId : null,
        message: message.trim(),
        createdAt: new Date(),
        replies: [],
        attachments: attachments
      };

      forum.messages.push(newMessage);
      await forum.save();

      await logAction({
        action: 'add_message',
        category: 'forum',
        userId: req.user ? req.user.userId : null,
        targetId: forumId,
        details: { message: message.trim(), attachmentCount: attachments.length }
      });

      res.status(201).json(newMessage);
    } catch (err) {
      console.error('Error in addMessage:', err);

      // Nettoyer les fichiers uploadés en cas d'erreur
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          const filePath = path.join(__dirname, '../uploads/forums', file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }

      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
];

// POST /api/forums/:forumId/messages/:messageId/replies → ajouter une réponse avec fichiers
exports.addReply = [
  upload.array('attachments', 5), // Maximum 5 fichiers
  async (req, res) => {
    const { forumId, messageId } = req.params;

    // Avec multer et FormData, les données sont dans req.body mais peuvent être undefined
    const message = req.body.message || '';

    console.log(`forums.controller.js → addReply | forumId = ${forumId}, messageId = ${messageId}`);
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);

    // Vérifier que le message n'est pas vide
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'La réponse ne peut pas être vide' });
    }

    try {
      const forum = await Forum.findById(forumId);
      if (!forum) {
        return res.status(404).json({ message: 'Forum non trouvé' });
      }

      const messageToReply = forum.messages.find(msg => msg._id.toString() === messageId);
      if (!messageToReply) {
        console.log('Message non trouvé avec ID:', messageId);
        return res.status(404).json({ message: 'Message non trouvé' });
      }

      // Traitement des fichiers attachés
      const attachments = [];
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          attachments.push({
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            uploadedAt: new Date()
          });
        });
      }

      const newReply = {
        _id: new ObjectId(),
        userId: req.user ? req.user.userId : null,
        message: message.trim(),
        createdAt: new Date(),
        attachments: attachments
      };

      if (!messageToReply.replies) {
        messageToReply.replies = [];
      }

      messageToReply.replies.push(newReply);
      await forum.save();

      await logAction({
        action: 'add_reply',
        category: 'forum',
        userId: req.user ? req.user.userId : null,
        targetId: forumId,
        details: { messageId, reply: message.trim(), attachmentCount: attachments.length }
      });

      res.status(201).json(newReply);
    } catch (err) {
      console.error('Error in addReply:', err);

      // Nettoyer les fichiers uploadés en cas d'erreur
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          const filePath = path.join(__dirname, '../uploads/forums', file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }

      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
];

// PUT /api/forums/:forumId/title → modifier le titre du forum (ROLE_PROF, ROLE_ADMIN)
exports.updateForumTitle = async (req, res) => {
  const forumId = req.params.forumId;
  const { title } = req.body;
  console.log(`forums.controller.js → updateForumTitle | forumId = ${forumId}, title = "${title}"`);

  try {
    const forum = await Forum.findById(forumId);
    if (!forum) {
      return res.status(404).json({ message: 'Forum non trouvé' });
    }

    const oldTitle = forum.title;
    forum.title = title;
    forum.updatedAt = new Date();
    await forum.save();

    await logAction({
      action: 'update_forum_title',
      category: 'forum',
      userId: req.user.userId,
      targetId: forumId,
      details: { oldTitle, newTitle: title }
    });

    res.json({ message: 'Titre du forum mis à jour', forum });
  } catch (err) {
    console.error('Error in updateForumTitle:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /api/forums/:forumId → supprimer un forum (ROLE_ADMIN uniquement)
exports.deleteForum = async (req, res) => {
  const forumId = req.params.forumId;
  console.log(`forums.controller.js → deleteForum | forumId = ${forumId}`);

  try {
    const forum = await Forum.findById(forumId);
    if (!forum) {
      return res.status(404).json({ message: 'Forum non trouvé' });
    }

    // Supprimer les fichiers associés
    forum.messages.forEach(message => {
      if (message.attachments) {
        message.attachments.forEach(attachment => {
          const filePath = path.join(__dirname, '../uploads/forums', attachment.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
      if (message.replies) {
        message.replies.forEach(reply => {
          if (reply.attachments) {
            reply.attachments.forEach(attachment => {
              const filePath = path.join(__dirname, '../uploads/forums', attachment.filename);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            });
          }
        });
      }
    });

    await Forum.findByIdAndDelete(forumId);

    await logAction({
      action: 'delete_forum',
      category: 'forum',
      userId: req.user.userId,
      targetId: forumId,
      details: { title: forum.title, messageCount: forum.messages.length }
    });

    res.json({ message: 'Forum supprimé avec succès' });
  } catch (err) {
    console.error('Error in deleteForum:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /api/forums/:forumId/messages/:messageId → supprimer un message (ROLE_PROF, ROLE_ADMIN)
exports.deleteMessage = async (req, res) => {
  const { forumId, messageId } = req.params;
  console.log(`forums.controller.js → deleteMessage | forumId = ${forumId}, messageId = ${messageId}`);

  try {
    const forum = await Forum.findById(forumId);
    if (!forum) {
      return res.status(404).json({ message: 'Forum non trouvé' });
    }

    const messageIndex = forum.messages.findIndex(msg => msg._id.toString() === messageId);
    if (messageIndex === -1) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    const messageToDelete = forum.messages[messageIndex];

    // Supprimer les fichiers attachés
    if (messageToDelete.attachments) {
      messageToDelete.attachments.forEach(attachment => {
        const filePath = path.join(__dirname, '../uploads/forums', attachment.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    // Supprimer les fichiers des réponses
    if (messageToDelete.replies) {
      messageToDelete.replies.forEach(reply => {
        if (reply.attachments) {
          reply.attachments.forEach(attachment => {
            const filePath = path.join(__dirname, '../uploads/forums', attachment.filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          });
        }
      });
    }

    forum.messages.splice(messageIndex, 1);
    await forum.save();

    await logAction({
      action: 'delete_message',
      category: 'forum',
      userId: req.user.userId,
      targetId: forumId,
      details: { messageId, deletedMessage: messageToDelete.message }
    });

    res.json({ message: 'Message supprimé avec succès' });
  } catch (err) {
    console.error('Error in deleteMessage:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /api/forums/:forumId/messages/:messageId/replies/:replyId → supprimer une réponse (ROLE_PROF, ROLE_ADMIN)
exports.deleteReply = async (req, res) => {
  const { forumId, messageId, replyId } = req.params;
  console.log(`forums.controller.js → deleteReply | forumId = ${forumId}, messageId = ${messageId}, replyId = ${replyId}`);

  try {
    const forum = await Forum.findById(forumId);
    if (!forum) {
      return res.status(404).json({ message: 'Forum non trouvé' });
    }

    const message = forum.messages.find(msg => msg._id.toString() === messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    const replyIndex = message.replies.findIndex(reply => reply._id.toString() === replyId);
    if (replyIndex === -1) {
      return res.status(404).json({ message: 'Réponse non trouvée' });
    }

    const replyToDelete = message.replies[replyIndex];

    // Supprimer les fichiers attachés
    if (replyToDelete.attachments) {
      replyToDelete.attachments.forEach(attachment => {
        const filePath = path.join(__dirname, '../uploads/forums', attachment.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    message.replies.splice(replyIndex, 1);
    await forum.save();

    await logAction({
      action: 'delete_reply',
      category: 'forum',
      userId: req.user.userId,
      targetId: forumId,
      details: { messageId, replyId, deletedReply: replyToDelete.message }
    });

    res.json({ message: 'Réponse supprimée avec succès' });
  } catch (err) {
    console.error('Error in deleteReply:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /api/forums/:forumId/messages/:messageId → modifier un message (ROLE_PROF, ROLE_ADMIN)
exports.updateMessage = async (req, res) => {
  const { forumId, messageId } = req.params;
  const { message } = req.body;
  console.log(`forums.controller.js → updateMessage | forumId = ${forumId}, messageId = ${messageId}`);

  try {
    const forum = await Forum.findById(forumId);
    if (!forum) {
      return res.status(404).json({ message: 'Forum non trouvé' });
    }

    const messageToUpdate = forum.messages.find(msg => msg._id.toString() === messageId);
    if (!messageToUpdate) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    const oldMessage = messageToUpdate.message;
    messageToUpdate.message = message;
    messageToUpdate.updatedAt = new Date();
    messageToUpdate.isEdited = true;
    await forum.save();

    await logAction({
      action: 'update_message',
      category: 'forum',
      userId: req.user.userId,
      targetId: forumId,
      details: { messageId, oldMessage, newMessage: message }
    });

    res.json({ message: 'Message mis à jour avec succès', updatedMessage: messageToUpdate });
  } catch (err) {
    console.error('Error in updateMessage:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /api/forums/:forumId/messages/:messageId/replies/:replyId → modifier une réponse
exports.updateReply = async (req, res) => {
  const { forumId, messageId, replyId } = req.params;
  const { message } = req.body;
  console.log("Message to update:", message);
  console.log(`forums.controller.js → updateReply | forumId = ${forumId}, messageId = ${messageId}, replyId = ${replyId}`);
  console.log('User from token:', req.user);

  try {
    const forum = await Forum.findById(forumId);
    if (!forum) {
      return res.status(404).json({ message: 'Forum non trouvé' });
    }

    const messageToUpdate = forum.messages.find(msg => msg._id.toString() === messageId);
    if (!messageToUpdate) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    const replyToUpdate = messageToUpdate.replies.find(reply => reply._id.toString() === replyId);
    if (!replyToUpdate) {
      return res.status(404).json({ message: 'Réponse non trouvée' });
    }

    // Vérification des permissions : Seul l'auteur ou un modérateur peut modifier
    const userRoles = req.user.roles || [req.user.role] || [];
    const isAuthor = replyToUpdate.userId === req.user.userId;
    const isModerator = userRoles.some(role => ['ROLE_PROF', 'ROLE_ADMIN'].includes(role));

    console.log('Permission check for reply:', {
      replyUserId: replyToUpdate.userId,
      currentUserId: req.user.userId,
      isAuthor,
      userRoles,
      isModerator
    });

    if (!isAuthor && !isModerator) {
      return res.status(403).json({
        message: 'Vous ne pouvez modifier que vos propres réponses'
      });
    }
    const oldMessage = replyToUpdate.message;
    replyToUpdate.message = message;
    replyToUpdate.updatedAt = new Date();
    replyToUpdate.isEdited = true;
    console.log('Updating reply:', replyToUpdate);
    await forum.save();
    console.log('Reply updated successfully');

    await logAction({
      action: 'update_reply',
      category: 'forum',
      userId: req.user.userId,
      targetId: forumId,
      details: { messageId, replyId, oldMessage, newMessage: message }
    });

    res.json({ message: 'Réponse mise à jour avec succès', updatedReply: replyToUpdate });
  } catch (err) {
    console.error('Error in updateReply:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/forums/download/:filename → télécharger un fichier
exports.downloadFile = async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads/forums', filename);

  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }

    res.download(filePath);
  } catch (err) {
    console.error('Error in downloadFile:', err);
    res.status(500).json({ message: 'Erreur lors du téléchargement' });
  }
};

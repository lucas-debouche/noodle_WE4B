const { ObjectId } = require('mongodb');
const Forum = require('../models/forum.model');
const { logAction } = require("../utils/logActions");

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

// POST /api/forums/:forumId/messages → ajouter un message (ROLE_USER, ROLE_PROF, ROLE_ADMIN)
exports.addMessage = async (req, res) => {
  const forumId = req.params.forumId;
  const { message } = req.body;
  console.log(`forums.controller.js → addMessage | forumId = ${forumId}, message = "${message}"`);

  try {
    const forum = await Forum.findById(forumId);
    if (!forum) {
      return res.status(404).json({ message: 'Forum non trouvé' });
    }

    const newMessage = {
      _id: new ObjectId(),
      userId: req.user ? req.user.userId : null,
      message: message,
      createdAt: new Date(),
      replies: []
    };

    forum.messages.push(newMessage);
    await forum.save();

    await logAction({
      action: 'add_message',
      category: 'forum',
      userId: req.user ? req.user.userId : null,
      targetId: forumId,
      details: { message }
    });

    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Error in addMessage:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /api/forums/:forumId/messages/:messageId/replies → ajouter une réponse à un message
exports.addReply = async (req, res) => {
  const { forumId, messageId } = req.params;
  const { message } = req.body;
  console.log(`forums.controller.js → addReply | forumId = ${forumId}, messageId = ${messageId}`);

  try {
    const forum = await Forum.findById(forumId);
    if (!forum) {
      return res.status(404).json({ message: 'Forum non trouvé' });
    }

    // Trouver le message par son _id
    const messageToReply = forum.messages.find(msg => msg._id.toString() === messageId);
    if (!messageToReply) {
      console.log('Message non trouvé avec ID:', messageId);
      console.log('Messages disponibles:', forum.messages.map(m => m._id.toString()));
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    const newReply = {
      _id: new ObjectId(),
      userId: req.user ? req.user.userId : null,
      message: message,
      createdAt: new Date()
    };

    // Initialiser le tableau des réponses s'il n'existe pas
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
      details: { messageId, reply: message }
    });

    res.status(201).json(newReply);
  } catch (err) {
    console.error('Error in addReply:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

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

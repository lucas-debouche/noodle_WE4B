const { ObjectId } = require('mongodb');
const Forum = require('../models/forum.model');

// GET /api/forums/:ueId → récupérer les forums par ueId
exports.getForumsByUe = async (req, res) => {
  const ueIdParam = req.params.ueId;
  console.log(`forums.controller.js → getForumsByUe | ueId = ${ueIdParam}`);

  try {
    // Recherche par string
    let forums = await Forum.find({ ueId: ueIdParam });

    // Si pas trouvé et ueId est un ObjectId valide → tente par ObjectId
    if (forums.length === 0 && ObjectId.isValid(ueIdParam)) {
      forums = await Forum.find({ ueId: new ObjectId(ueIdParam) });
    }

    res.json(forums);
  } catch (err) {
    console.error('Error in getForumsByUe:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /api/forums → créer un nouveau forum
exports.createForum = async (req, res) => {
  console.log('createForum → req.user =', req.user); // Ajoute ce log

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

// POST /api/forums/:forumId/messages → ajouter un message
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
      userId: req.user ? req.user.userId : null, // Optionnel
      message: message,
      createdAt: new Date()
    };

    forum.messages.push(newMessage);
    await forum.save();

    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Error in addMessage:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

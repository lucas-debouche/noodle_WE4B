const express = require('express');
const router = express.Router();
const Post = require('../models/post.model');
const Type = require('../models/type.model');
const multer = require('multer');
const upload = multer();

// Obtenir tous les posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('utilisateur_id', 'nom prenom email')
      .populate('type_id', 'nom')
      .populate('priorite_id', 'nom');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtenir les posts associés à une ue
router.get('/ue/:ueId', async (req, res) => {
  try {
    const posts = await Post.find({ ue_id: req.params.ueId })
      .populate('utilisateur_id', 'nom prenom email')
      .populate('type_id', 'nom')
      .populate('priorite_id', 'nom');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtenir un post par ID
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('utilisateur_id', 'nom prenom email')
      .populate('type_id', 'nom')
      .populate('priorite_id', 'nom');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Création d'un post (accepte JSON ou multipart)
router.post('/', upload.single('fichier'), async (req, res) => {
  try {
    let postData = {};
    if (req.is('multipart/form-data')) {
      // Pour multipart, les champs sont dans req.body, le fichier dans req.file
      postData = {
        ...req.body,
        fichier_nom: req.file ? req.file.originalname : null,
        fichier_type: req.file ? req.file.mimetype : null,
        fichier_taille: req.file ? req.file.size : null,
      };
    } else {
      // Pour JSON
      postData = req.body;
    }
    const post = new Post(postData);
    await post.save();
    const populatedPost = await Post.findById(post._id)
      .populate('utilisateur_id', 'nom prenom email')
      .populate('type_id', 'nom')
      .populate('priorite_id', 'nom');
    res.status(201).json(populatedPost);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Mettre à jour le statut "fait" pour un utilisateur sur un post
router.patch('/:id/fait', async (req, res) => {
  const { utilisateurId, fait } = req.body;
  if (!utilisateurId) {
    return res.status(400).json({ error: 'utilisateurId requis' });
  }
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const index = post.faitPar.findIndex(id => id.toString() === utilisateurId);
    if (fait && index === -1) {
      post.faitPar.push(utilisateurId);
    } else if (!fait && index !== -1) {
      post.faitPar.splice(index, 1);
    }
    await post.save();
    res.json({ success: true, faitPar: post.faitPar });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Post = require('../models/post.model');

// Obtenir tous les posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtenir les posts associés à une ue
router.get('/ue/:ueId', async (req, res) => {
  try {
    const posts = await Post.find({ ue_id: req.params.ueId });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtenir un post par ID
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

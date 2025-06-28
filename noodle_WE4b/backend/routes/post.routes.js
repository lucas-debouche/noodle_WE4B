const express = require('express');
const router = express.Router();
const Post = require('../models/post.model');
const UE = require('../models/ue.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require("../security/middleware_auth");
const { logAction } = require('../utils/logActions');

// Multer storage dynamique selon l'UE et la catégorie
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      // Récupère l'ID de l'UE depuis le body (FormData)
      const ueId = req.body.ue_id;
      if (!ueId) return cb(new Error('ue_id manquant dans le formulaire'));

      // Va chercher le code de l'UE en base
      const ue = await UE.findById(ueId).exec();
      if (!ue || !ue.code) return cb(new Error('UE non trouvée'));

      // Catégorie (TP, TD, etc.)
      const categorie = req.body.categorie || 'TP';

      // Dossier cible : uploads/ue/[codeUe]/posts/[categorie]
      const uploadPath = path.join(__dirname, '..', 'uploads', 'ue', ue.code, 'posts', categorie);

      // Crée le dossier si besoin
      fs.mkdirSync(uploadPath, { recursive: true });

      cb(null, uploadPath);
    } catch (err) {
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

const renduStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      const post = await Post.findById(req.params.id).populate('ue_id');
      if (!post) return cb(new Error('Post non trouvé'));
      const ue = post.ue_id;
      const categorie = post.categorie;
      const uploadPath = path.join(__dirname, '..', 'uploads', 'ue', ue.code, 'posts', categorie, 'rendu');
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (err) {
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const uploadRendu = multer({ storage: renduStorage });

// Obtenir tous les posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('utilisateur_id', 'nom prenom email')
      .populate('type_id', 'nom')
      .populate('priorite_id', 'nom')
      .populate('rendus.utilisateur_id', 'nom prenom');
    await logAction({
      action: 'get_all_posts',
      category: 'post',
      userId: req.user ? req.user.userId : null,
      details: { success: true, postsCount: posts.length }
    });
    res.json(posts);
  } catch (err) {
    await logAction({
      action: 'error_get_posts',
      category: 'post',
      userId: req.user ? req.user.userId : null,
      details: { success: false, error: err.message }
    });
    res.status(500).json({ error: err.message });
  }
});

// Obtenir les posts associés à une ue
router.get('/ue/:ueId', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), async (req, res) => {
  console.log("req.user:", req.user);
  try {
    const posts = await Post.find({ ue_id: req.params.ueId })
      .populate('utilisateur_id', 'nom prenom email')
      .populate('type_id', 'nom')
      .populate('priorite_id', 'nom')
      .populate('rendus.utilisateur_id', 'nom prenom');
    await logAction({
      action: 'get_posts_by_ue',
      category: 'post',
      userId: req.user ? req.user.userId : null,
      details: { success: true, postsCount: posts.length }
    });
    res.json(posts);
  } catch (err) {
    await logAction({
      action: 'error_get_posts_by_ue',
      category: 'post',
      userId: req.user ? req.user.userId : null,
      details: { success: false, error: err.message }
    });
    res.status(500).json({ error: err.message });
  }
});

// Obtenir un post par ID
router.get('/:id', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('utilisateur_id', 'nom prenom email')
      .populate('type_id', 'nom')
      .populate('priorite_id', 'nom')
      .populate('rendus.utilisateur_id', 'nom prenom');
    if (!post) {
      await logAction({
        action: 'error_get_post_by_id',
        category: 'post',
        userId: req.user ? req.user.userId : null,
        targetId: req.params.id,
        details: { error: 'Post not found' }
      });
      return res.status(404).json({ message: 'Post not found' });
    }
    await logAction({
      action: 'get_post_by_id',
      category: 'post',
      userId: req.user ? req.user.userId : null,
      targetId: req.params.id,
      details: { success: true }
    });
    res.json(post);
  } catch (err) {
    await logAction({
      action: 'error_get_post_by_id',
      category: 'post',
      userId: req.user ? req.user.userId : null,
      targetId: req.params.id,
      details: { error: err.message }
    });
    res.status(500).json({ error: err.message });
  }
});

// Utilise upload.fields pour garantir la présence des champs texte et fichier
const uploadFields = upload.fields([
  { name: 'fichier', maxCount: 1 }
]);

router.post('/', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), uploadFields, async (req, res) => {
  let createdPost = null;

  try {
    let postData = req.body;
    // Si certains champs sont des tableaux (cas FormData), prends la première valeur
    ['ue_id', 'categorie', 'titre', 'contenu', 'type_id', 'priorite_id', 'utilisateur_id', 'date_publication', 'date_rendu'].forEach(field => {
      if (Array.isArray(postData[field])) postData[field] = postData[field][0];
    });

    // Gestion du fichier
    let file = null;
    if (req.files && req.files.fichier && req.files.fichier.length > 0) {
      file = req.files.fichier[0];
      postData.fichier_nom = file.originalname;
      postData.fichier_type = file.mimetype;
      postData.fichier_taille = file.size;
      // Stocke le chemin relatif pour usage front
      postData.fichier_chemin = path.relative(path.join(__dirname, '..'), file.path).replace(/\\/g, '/');
      // Pour debug
      console.log("Fichier reçu :", file.originalname, "->", postData.fichier_chemin);
    } else {
      postData.fichier_nom = null;
      postData.fichier_type = null;
      postData.fichier_taille = null;
      postData.fichier_chemin = null;
      // Pour debug
      console.log('req.files:', req.files);
      console.log("Aucun fichier reçu pour ce post.");
    }

    const post = new Post(postData);
    createdPost = await post.save();

    const populatedPost = await Post.findById(createdPost._id)
      .populate('utilisateur_id', 'nom prenom email')
      .populate('type_id', 'nom')
      .populate('priorite_id', 'nom')
      .populate('rendus.utilisateur_id', 'nom prenom');

    await logAction({
      action: 'create_post',
      category: 'post',
      userId: req.user ? req.user.userId : null,
      targetId: createdPost._id,
      details: { post: populatedPost, success: true }
    });

    res.status(201).json(populatedPost);
  } catch (err) {
    await logAction({
      action: 'error_create_post',
      category: 'post',
      userId: req.user ? req.user.userId : null,
      targetId: createdPost ? createdPost._id : null,
      details: { error: err.message }
    });
    res.status(400).json({ error: err.message });
  }
});

// Mettre à jour le statut "fait" pour un utilisateur sur un post
router.patch('/:id/fait', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), async (req, res) => {
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
    await logAction({
      action: 'update_post_fait',
      category: 'post',
      userId: req.user ? req.user.userId : null,
      targetId: post._id,
      details: { utilisateurId, fait, success: true }
    });
    res.json({ success: true, faitPar: post.faitPar });
  } catch (err) {
    await logAction({
      action: 'error_update_post_fait',
      category: 'post',
      userId: req.user ? req.user.userId : null,
      targetId: req.params.id,
      details: { error: err.message }
    });
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/rendu', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), uploadRendu.single('rendu'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post non trouvé' });
    const userId = req.body.utilisateur_id;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Aucun fichier reçu' });

    // Ajoute le rendu
    post.rendus.push({
      utilisateur_id: userId,
      fichier_nom: file.originalname,
      fichier_type: file.mimetype,
      fichier_taille: file.size,
      fichier_chemin: path.relative(path.join(__dirname, '..'), file.path).replace(/\\/g, '/'),
      date_rendu: new Date(),
      etat_rendu: 'en attente'
    });

    await post.save();
    await logAction({
      action: 'submit_rendu',
      category: 'post',
      userId: req.user ? req.user.userId : null,
      targetId: post._id,
      details: { utilisateurId: userId, renduFile: file.originalname, success: true }
    });
    res.status(201).json({ success: true });
  } catch (err) {
    await logAction({
      action: 'error_submit_rendu',
      category: 'post',
      userId: req.user ? req.user.userId : null,
      targetId: req.params.id,
      details: { error: err.message }
    });
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:postId/rendu/:userId/note', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), async (req, res) => {
  const { note } = req.body;
  if (typeof note !== 'number' || note < 0 || note > 20) {
    return res.status(400).json({ error: 'Note invalide' });
  }
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post non trouvé' });
    const rendu = post.rendus.find(r => r.utilisateur_id.toString() === req.params.userId);
    if (!rendu) return res.status(404).json({ error: 'Rendu non trouvé' });
    rendu.note = note;
    rendu.etat_rendu = 'corrigé';

    await post.save();
    await logAction({
      action: 'update_rendu_note',
      category: 'post',
      userId: req.user ? req.user.userId : null,
      targetId: post._id,
      details: { utilisateurId: req.params.userId, note, success: true }
    });
    res.json({ success: true, rendu });
  } catch (err) {
    await logAction({
      action: 'error_update_rendu_note',
      category: 'post',
      userId: req.user ? req.user.userId : null,
      targetId: req.params.postId,
      details: { error: err.message }
    });
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:postId/rendu/:userId/commentaire', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), async (req, res) => {
  const { commentaire } = req.body;
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post non trouvé' });
    const rendu = post.rendus.find(r => r.utilisateur_id.toString() === req.params.userId);
    if (!rendu) return res.status(404).json({ error: 'Rendu non trouvé' });
    rendu.commentaire = commentaire;

    await post.save();
    await logAction({
      action: 'update_rendu_commentaire',
      category: 'post',
      userId: req.user ? req.user.userId : null,
      targetId: post._id,
      details: { utilisateurId: req.params.userId, commentaire, success: true }
    });
    res.json({ success: true, rendu });
  } catch (err) {
    await logAction({
      action: 'error_update_rendu_commentaire',
      category: 'post',
      userId: req.user ? req.user.userId : null,
      targetId: req.params.postId,
      details: { error: err.message }
    });
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

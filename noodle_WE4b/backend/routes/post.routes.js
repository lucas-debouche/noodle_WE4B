const express = require('express');
const router = express.Router();
const Post = require('../models/post.model');
const UE = require('../models/ue.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

      // Dossier cible : uploads/ue/[codeUe]/posts/[categorie]
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

// Utilise upload.fields pour garantir la présence des champs texte et fichier
const uploadFields = upload.fields([
  { name: 'fichier', maxCount: 1 }
]);

router.post('/', uploadFields, async (req, res) => {
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

const express = require('express');
const router = express.Router();
const Utilisateur = require('../models/utilisateur.model');
const Ue = require('../models/ue.model');
const utilisateurController = require('../controllers/utilisateur.controller');
const authMiddleware = require('../security/middleware_auth');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require("path");
const fs = require('fs');
const { logAction } = require('../utils/logActions');


// GET / → obtenir tous les utilisateurs
router.get('/', utilisateurController.getAllUtilisateurs);

// GET /current → obtenir l'utilisateur actuel
router.get('/current', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), utilisateurController.getCurrentUtilisateur);

// Configuration pour l'upload lors de la mise à jour de photo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const nomUser = req.params.nom;
    const dir = path.join(__dirname, '../uploads/user', nomUser, 'photo_profil');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// Configuration pour l'upload lors de la création d'un utilisateur
const storageCreation = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/user/tmp/photo_profil');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const uploadCreation = multer({ storage: storageCreation });

// PUT /update_photo/:nom → mettre à jour la photo d'un utilisateur
router.put('/update_photo/:nom', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), upload.single('photo'), async (req, res) => {
  try {
    const photo = req.file ? req.file.filename : null;
    const nom = req.body.nom;
    const prenom = req.body.prenom;

    const utilisateur = await Utilisateur.findOne({ nom, prenom });
    if (!utilisateur) {
      await logAction({
        action: 'error_update_user_photo',
        category: 'utilisateur',
        userId: req.user ? req.user._id : null,
        targetId: utilisateur ? utilisateur._id : null,
        details: { error: 'Utilisateur non trouvé' }
      });
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (photo && utilisateur.photo) {
      const oldPhotoPath = path.join(__dirname, '../uploads/user', nom, 'photo_profil', utilisateur.photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    if (photo) {
      utilisateur.photo = photo;
    }

    await utilisateur.save();

    await logAction({
      action: 'update_user_photo',
      category: 'utilisateur',
      userId: req.user ? req.user._id : null,
      targetId: utilisateur._id,
      details: { success: true, photo: utilisateur.photo }
    });
    res.status(200).json({
      message: 'Utilisateur mis à jour avec succès',
      utilisateur,
    });
  } catch (err) {
    console.error(err);
    await logAction({
      action: 'error_update_user_photo',
      category: 'utilisateur',
      userId: req.user ? req.user._id : null,
      details: { error: err.message }
    });
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
});

// GET /ue/:ueId/participants → obtenir les participants d'une UE (nouvelle route)
router.get('/ue/:ueId/participants',
  authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']),
  utilisateurController.getParticipantsByUe
);

// GET /:userId/ue → obtenir les UEs d'un utilisateur
router.get('/:userId/ue', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), utilisateurController.getUesByUserId);

// GET /:userId → obtenir un utilisateur par son ID
router.get('/:userId', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), utilisateurController.getUtilisateurById);

// POST / → créer un utilisateur avec photo
router.post('/', uploadCreation.single('photo'), utilisateurController.createUtilisateur);

// PUT /:userId → modifier un utilisateur
router.put('/:userId', uploadCreation.single('photo'), utilisateurController.updateUtilisateur);

module.exports = router;

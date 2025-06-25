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

    res.status(200).json({
      message: 'Utilisateur mis à jour avec succès',
      utilisateur,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
});

// GET /ue/:ueId/participants → obtenir les participants d'une UE (nouvelle route)
router.get('/ue/:ueId/participants',
  authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']),
  utilisateurController.getParticipantsByUe
);

// GET /ue/:ueId → obtenir les utilisateurs associés à une UE (route pour compatibilité)
router.get('/ue/:ueId', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), async (req, res) => {
  try {
    const ueId = req.params.ueId;

    // Récupérer l'UE avec ses participants
    let ue;
    if (mongoose.Types.ObjectId.isValid(ueId)) {
      ue = await Ue.findById(ueId);
    }
    if (!ue) {
      ue = await Ue.findOne({ id: ueId });
    }
    if (!ue) {
      ue = await Ue.findOne({ code: ueId });
    }

    if (!ue) {
      return res.status(404).json({ error: 'UE non trouvée.' });
    }

    if (!ue.participants || ue.participants.length === 0) {
      return res.json([]);
    }

    // Récupérer les utilisateurs participants
    const utilisateurs = await Utilisateur.find({
      _id: { $in: ue.participants }
    });

    res.json(utilisateurs);
  } catch (err) {
    console.error('Erreur lors de la récupération des utilisateurs par UE:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs par UE.' });
  }
});

// GET /:userId → obtenir un utilisateur par son ID
router.get('/:userId', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), utilisateurController.getUtilisateurById);

// POST / → créer un utilisateur avec photo
router.post('/', uploadCreation.single('photo'), utilisateurController.createUtilisateur);

// PUT /:userId → modifier un utilisateur
router.put('/:userId', uploadCreation.single('photo'), utilisateurController.updateUtilisateur);

module.exports = router;

const express = require('express');
const router = express.Router();
const Utilisateur = require('../models/utilisateur.model');
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

// Configurer Multer pour le stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const nomUser = req.params.nom;
    console.log("nomUser : ", nomUser);
    const dir = path.join(__dirname, '../uploads/user', nomUser, 'photo_profil'); // Chemin dynamique

    // Vérifier si le dossier existe, sinon le créer
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir); // Dossier cible
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Nom unique
  },
});

const upload = multer({ storage });

// PUT /update_photo/:nom → mettre à jour la photo d'un utilisateur
router.put('/update_photo/:nom', upload.single('photo'), async (req, res) => {
  try {
    console.log('Mise à jour de la photo de l\'utilisateur');
    const photo = req.file ? req.file.filename : null;
    const nom = req.body.nom;
    const prenom = req.body.prenom;
    console.log('Photo reçue :', photo);

    const utilisateur = await Utilisateur.findOne({ nom, prenom });
    console.log('Utilisateur trouvé :', utilisateur);
    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (photo && utilisateur.photo) {
      const oldPhotoPath = path.join(__dirname, '../uploads/user', nom, 'photo_profil', utilisateur.photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
        console.log('Ancienne photo supprimée :', oldPhotoPath);
      }
    }

    if (photo) {
      utilisateur.photo = photo;
    }
    console.log('Photo mise à jour :', utilisateur.photo);

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

// GET /:userId → obtenir un utilisateur par son ID (pour afficher les auteurs de message du forum)
router.get('/:userId', utilisateurController.getUtilisateurById);

module.exports = router;

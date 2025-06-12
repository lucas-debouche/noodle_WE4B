const express = require('express');
const router = express.Router();
const Utilisateur = require('../models/utilisateur.model');
const authMiddleware = require('../security/middleware_auth');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require("path");
const fs = require('fs');


// Obtenir tous les utilisateurs
router.get('/', async (req, res) => {
  try {
    const utilisateurs = await Utilisateur.find();
    if (utilisateurs.length === 0) {
      return res.status(404).json({ error: 'Aucun utilisateur trouvé.' });
    }
    res.json(utilisateurs);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs.' });
  }
});

// Obtenir l'utilisateur actuel
router.get('/current', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), async (req, res) => {
  console.log('/current : Début de la gestion de la requête');

  try {
    console.log('/current : Utilisateur ID extrait du token :', req.user._id);

    // Récupération de l’utilisateur actuel dans MongoDB
    // Conversion de l'ID du token JWT en ObjectId avant utilisation
    const utilisateur = await Utilisateur.findById(new mongoose.Types.ObjectId(req.user.userId));
    if (!utilisateur) {
      console.log('/current : Aucun utilisateur trouvé avec cet ID');
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    console.log('/current : Utilisateur trouvé, envoi de la réponse...');
    res.status(200).json(utilisateur);
  } catch (err) {
    console.error('/current : Erreur lors de la récupération des données utilisateur :', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des données utilisateur.' });
  }
});

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


// Route pour mettre à jour un utilisateur
router.put('/update_photo/:nom', upload.single('photo'), async (req, res) => {
  try {
    console.log('Mise à jour de la photo de l\'utilisateur');
    const photo = req.file ? req.file.filename : null; // Si une nouvelle photo a été envoyée
    const nom = req.body.nom;
    const prenom = req.body.prenom;
    console.log('Photo reçue :', photo);

    // Trouver l'utilisateur et effectuer la mise à jour
    const utilisateur = await Utilisateur.findOne({ nom, prenom });
    console.log('Utilisateur trouvé :', utilisateur);
    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Supprimer l'ancienne photo si une nouvelle est envoyée
    if (photo && utilisateur.photo) {
      const oldPhotoPath = path.join(__dirname, '../uploads/user', nom, 'photo_profil', utilisateur.photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath); // Supprimer l'ancienne photo
        console.log('Ancienne photo supprimée :', oldPhotoPath);
      }
    }

    // Mettre à jour la photo si une nouvelle est envoyée
    if (photo) {
      utilisateur.photo = photo;
    }
    console.log('Photo mise à jour :', utilisateur.photo);

    // Sauvegarder les modifications
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

module.exports = router;

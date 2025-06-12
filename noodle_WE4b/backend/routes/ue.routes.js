const express = require('express');
const router = express.Router();
const Ue = require('../models/ue.model');
const multer = require("multer");
const { diskStorage } = require("multer");
const fs = require('fs');
const path = require('path');


// Obtenir toutes les Unités d'Enseignement (UE)
router.get('/', async (req, res) => {
  try {
    const ue = await Ue.find();
    res.json(ue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Configuration multer pour stocker les images dans un dossier spécifique
const storage = diskStorage({
  destination: function (req, file, cb) {
    const codeUE = req.params.code; // Récupérer le code de l'UE
    const dir = path.join(__dirname, '../uploads/ue', codeUE, 'photo'); // Chemin dynamique

    // Vérifier si le dossier existe, sinon le créer
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir); // Définir le dossier cible
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Renommer l'image avec un timestamp
  }
});
const upload = multer({ storage: storage });

// Route pour ajouter une image à une UE
router.post('/:code/upload-photo', upload.single('image'), async (req, res) => {
  try {
    const ue = await Ue.findOne({ code: req.params.code });
    if (!ue) {
      return res.status(404).json({ message: 'Ue non trouvée' });
    }
    const relativePath = `/uploads/ue/${req.params.code}/photo/${req.file.filename}`;
    ue.image = relativePath;    await ue.save();
    res.status(200).json({ message: 'Image téléchargée avec succès', ue });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement de l\'image', error });
  }
});


module.exports = router;

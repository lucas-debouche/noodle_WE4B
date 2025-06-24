const express = require('express');
const router = express.Router();
const ueController = require('../controllers/ue.controller');
const authMiddleware = require('../security/middleware_auth');
const multer = require("multer");
const { diskStorage } = require("multer");
const fs = require('fs');
const path = require('path');
const Ue = require('../models/ue.model'); // nécessaire pour upload-photo

// ===============================
// ROUTES PUBLIQUES OU SPÉCIFIQUES
// ===============================

// Recherche d’UE
router.get('/search', ueController.searchUes);

// ===============================
// ROUTES PROTÉGÉES (USER/PROF/ADMIN)
// ===============================

// Obtenir toutes les UE
router.get('/', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), ueController.getAllUes);

// Obtenir une UE par son ID
router.get('/:ueId', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), ueController.getUeById);

// Obtenir les statistiques des participants
router.get('/:ueId/participants/stats', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), ueController.getParticipantsStats);

// Obtenir les participants d'une UE
router.get('/:ueId/participants', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), ueController.getParticipantsByUe);

// ===============================
// ROUTES PROTÉGÉES (PROF/ADMIN)
// ===============================

// Ajouter un participant
router.post('/:ueId/participants',
  authMiddleware(['ROLE_PROF', 'ROLE_ADMIN']),
  ueController.addParticipantToUe
);

// Retirer un participant
router.delete('/:ueId/participants/:utilisateurId',
  authMiddleware(['ROLE_PROF', 'ROLE_ADMIN']),
  ueController.removeParticipantFromUe
);

// ===============================
// ROUTES PROTÉGÉES (ADMIN SEUL)
// ===============================

// Créer une UE
router.post('/',
  authMiddleware(['ROLE_ADMIN']),
  ueController.createUe
);

// Modifier une UE
router.put('/:ueId',
  authMiddleware(['ROLE_ADMIN']),
  ueController.updateUe
);

// Supprimer une UE
router.delete('/:ueId',
  authMiddleware(['ROLE_ADMIN']),
  ueController.deleteUe
);

// ===============================
// UPLOAD IMAGE POUR UNE UE
// ===============================

const storage = diskStorage({
  destination: function (req, file, cb) {
    const codeUE = req.params.code;
    const dir = path.join(__dirname, '../uploads/ue', codeUE, 'photo');

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.post('/:code/upload-photo', authMiddleware(['ROLE_PROF', 'ROLE_ADMIN']), upload.single('image'), async (req, res) => {
  try {
    const ue = await Ue.findOne({ code: req.params.code });
    if (!ue) {
      return res.status(404).json({ message: 'Ue non trouvée' });
    }

    const relativePath = `/uploads/ue/${req.params.code}/photo/${req.file.filename}`;
    ue.image = relativePath;
    await ue.save();

    res.status(200).json({ message: 'Image téléchargée avec succès', ue });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement de l\'image', error });
  }
});

module.exports = router;

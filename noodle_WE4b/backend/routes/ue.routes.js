const express = require('express');
const router = express.Router();
const ueController = require('../controllers/ue.controller');
const authMiddleware = require('../security/middleware_auth');
const multer = require("multer");
const { diskStorage } = require("multer");
const fs = require('fs');
const path = require('path');
const Ue = require('../models/ue.model'); // nécessaire pour upload-photo
const { logAction } = require('../utils/logActions');
const UeUserSyncService = require('../utils/syncUtils'); // ✅ Ajout de l'import manquant

// ===============================
// ROUTES PUBLIQUES OU SPÉCIFIQUES
// ===============================

// Recherche d'UE
router.get('/search', ueController.searchUes);

// ===============================
// ROUTES PROTÉGÉES (USER/PROF/ADMIN)
// ===============================

// Obtenir toutes les UE
router.get('/', ueController.getAllUes);

// Obtenir une UE par son ID
router.get('/:ueId', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), ueController.getUeById);

// Obtenir les statistiques des participants d'une UE
router.get('/:ueId/participants/stats', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), ueController.getParticipantsStats);

// Obtenir les participants d'une UE
router.get('/:ueId/participants', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), ueController.getParticipantsByUe);

// Ajouter un participant à une UE (protégé)
router.post('/:ueId/participants',
  authMiddleware(['ROLE_PROF', 'ROLE_ADMIN']),
  ueController.addParticipantToUe
);

// Ajouter une UE (protégé)
router.post('/', authMiddleware(['ROLE_ADMIN']), ueController.createUe);

// Retirer un participant d'une UE (protégé)
router.delete('/:ueId/participants/:utilisateurId',
  authMiddleware(['ROLE_PROF', 'ROLE_ADMIN']),
  ueController.removeParticipantFromUe
);

// Modifier une UE (protégé)
router.put('/ue/:ueId',
  authMiddleware(['ROLE_PROF', 'ROLE_ADMIN']),
  ueController.updateUe
);

// Supprimer une UE (protégé)
router.delete('/ue/:ueId',
  authMiddleware(['ROLE_ADMIN']),
  ueController.deleteUe
);

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
router.post('/:code/upload-photo', authMiddleware(['ROLE_PROF', 'ROLE_ADMIN']), upload.single('image'), async (req, res) => {
  try {
    const ue = await Ue.findOne({ code: req.params.code });
    if (!ue) {
      await logAction({
        action: 'error_upload_ue_image',
        category: 'ue',
        userId: req.user ? req.user.userId : null,
        targetId: req.params.code,
        details: { error: 'UE not found' }
      });
      return res.status(404).json({ message: 'Ue non trouvée' });
    }
    const relativePath = `/uploads/ue/${req.params.code}/photo/${req.file.filename}`;
    ue.image = relativePath;
    await ue.save();
    await logAction({
      action: 'upload_ue_image',
      category: 'ue',
      userId: req.user ? req.user.userId : null,
      targetId: req.params.code,
      details: { success: true, imagePath: relativePath }
    });
    res.status(200).json({ message: 'Image téléchargée avec succès', ue });
  } catch (error) {
    await logAction({
      action: 'error_upload_ue_image',
      category: 'ue',
      userId: req.user ? req.user.userId : null,
      targetId: req.params.code,
      details: { error: error.message }
    });
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement de l\'image', error });
  }
});

// Route d'audit et réparation des synchronisations UE-Utilisateur
router.get('/audit/ue-user-sync',
  authMiddleware(['ROLE_ADMIN']),
  async (req, res) => {
    try {
      const result = await UeUserSyncService.auditAndRepair();

      await logAction({
        action: 'audit_ue_user_sync',
        category: 'admin',
        userId: req.user ? req.user.userId : null,
        details: result
      });

      res.json({
        success: true,
        message: `Audit terminé. ${result.inconsistencies} incohérences trouvées et corrigées.`,
        result: result
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'audit',
        error: error.message
      });
    }
  }
);

module.exports = router;

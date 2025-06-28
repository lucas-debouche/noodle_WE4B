const mongoose = require('mongoose');
const Utilisateur = require('../models/utilisateur.model');
const Ue = require('../models/ue.model');
const Departement = require('../models/departement.model');
const { logAction } = require("../utils/logActions");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const UeUserSyncService = require('../utils/syncUtils');


// Configuration Multer pour les images d'UE
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/ue');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ue-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé'), false);
  }
};

const upload = multer({
  storage: tempStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// GET /api/ue → récupérer toutes les UEs
exports.getAllUes = async (req, res) => {
  try {
    // Récupérer toutes les UEs avec les informations de département
    const ues = await Ue.aggregate([
      {
        $lookup: {
          from: 'departement',
          localField: 'departementId',
          foreignField: '_id',
          as: 'departement'
        }
      },
      {
        $addFields: {
          departementNom: { $arrayElemAt: ['$departement.nom', 0] }
        }
      },
      {
        $project: {
          departement: 0 // Exclure le tableau departement pour alléger la réponse
        }
      },
      { $sort: { code: 1 } }
    ]);

    // Ajouter les métadonnées pour chaque UE
    const uesWithMetadata = ues.map(ue => ({
      ...ue,
      id: ue._id.toString(),
      participantCount: ue.participants ? ue.participants.length : 0
    }));


    res.json(uesWithMetadata);
  } catch (err) {
    console.error('Error in getAllUes:', err);

    res.status(500).json({ error: err.message });
  }
};

// GET /api/ue/:ueId → récupérer une UE par son ID
exports.getUeById = async (req, res) => {
  try {
    const ueId = req.params.ueId;
    console.log(`ue.controller.js → getUeById | ueId = ${ueId}`);

    let ue;

    // Essayer de trouver par _id (ObjectId)
    if (mongoose.Types.ObjectId.isValid(ueId)) {
      ue = await Ue.findById(ueId);
    }

    // Si pas trouvé, essayer de trouver par le champ "id" personnalisé
    if (!ue) {
      ue = await Ue.findOne({ id: ueId });
    }

    // Si toujours pas trouvé, essayer par code
    if (!ue) {
      ue = await Ue.findOne({ code: ueId });
    }

    if (!ue) {
      return res.status(404).json({ message: 'UE non trouvée' });
    }

    // Récupérer les informations du département si présent
    let departementInfo = null;
    if (ue.departementId) {
      departementInfo = await Departement.findById(ue.departementId);
    }

    // Formater selon l'interface frontend
    const formattedUe = {
      id: ue._id.toString(),
      code: ue.code,
      intitule: ue.intitule,
      image: ue.image,
      description: ue.description,
      ects: ue.ects,
      departementId: ue.departementId ? ue.departementId.toString() : null,
      departementNom: departementInfo ? departementInfo.nom : null,
      participants: ue.participants || [],
      participantCount: ue.participants ? ue.participants.length : 0,
      createdAt: ue.createdAt,
      updatedAt: ue.updatedAt
    };


    res.json(formattedUe);
  } catch (err) {
    console.error('Error in getUeById:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /api/ue → créer une nouvelle UE
exports.createUe = [
  upload.single('image'),
  async (req, res) => {
    try {
      const { code, intitule, description, ects, departement, assigned_users } = req.body;

      const existingUe = await Ue.findOne({ code: code.toUpperCase() });
      if (existingUe) {
        return res.status(400).json({ success: false, message: 'Ce code UE existe déjà' });
      }

      let departementId = null;
      if (departement && departement !== 'null' && departement !== '' && departement !== 'undefined') {
        if (mongoose.Types.ObjectId.isValid(departement)) {
          const departementExists = await Departement.findById(departement);
          if (departementExists) departementId = departementExists._id;
        } else {
          const departementExists = await Departement.findOne({
            $or: [
              { nom: new RegExp(departement, 'i') },
              { code: departement.toUpperCase() }
            ]
          });
          if (departementExists) departementId = departementExists._id;
        }
      }

      // Créer les dossiers dédiés à cette UE
      const nomUeSafe = intitule.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9-_]/g, "_").toLowerCase();
      const ueDir = path.join(__dirname, '../uploads/ue', nomUeSafe);
      const photoDir = path.join(ueDir, 'photo');
      const postsDir = path.join(ueDir, 'posts');

      if (!fs.existsSync(photoDir)) fs.mkdirSync(photoDir, { recursive: true });
      if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir, { recursive: true });

      let imageFilename = null;
      if (req.file) {
        imageFilename = path.join(nomUeSafe, 'photo', req.file.filename);
        const destPath = path.join(__dirname, '../uploads/ue', imageFilename);
        fs.renameSync(
          path.join(__dirname, '../uploads/ue', req.file.filename),
          destPath
        );
      }

      // ✨ CRÉER L'UE D'ABORD SANS PARTICIPANTS
      const newUe = new Ue({
        code: code.toUpperCase(),
        intitule,
        description: description ? description.trim() : '',
        ects: parseInt(ects),
        image: req.file ? `/uploads/ue/${nomUeSafe}/photo/${req.file.filename}` : null,
        departementId,
        participants: [] // Vide au début
      });

      const savedUe = await newUe.save();
      console.log('✅ UE créée:', savedUe._id);

      // ✨ UTILISER LE SERVICE DE SYNCHRONISATION POUR AJOUTER LES PARTICIPANTS
      const participantsResults = [];
      const participantsErrors = [];

      if (assigned_users && Array.isArray(assigned_users) && assigned_users.length > 0) {
        console.log('👥 Attribution des utilisateurs via le service de synchronisation');

        for (const userId of assigned_users) {
          try {
            // Trouver l'utilisateur d'abord
            let user = null;
            if (mongoose.Types.ObjectId.isValid(userId)) {
              user = await Utilisateur.findById(userId);
            }
            if (!user) user = await Utilisateur.findOne({ id: userId });
            if (!user && typeof userId === 'string') {
              user = await Utilisateur.findOne({ email: userId });
            }

            if (user) {
              // Utiliser le service de synchronisation
              const result = await UeUserSyncService.addUserToUe(user._id, savedUe._id);
              participantsResults.push({
                userId: user._id,
                email: user.email,
                name: `${user.prenom} ${user.nom}`,
                synchronized: true
              });
              console.log(`✅ Utilisateur synchronisé: ${user.email}`);
            } else {
              participantsErrors.push({
                userId: userId,
                error: 'Utilisateur non trouvé'
              });
              console.log('⚠️ Utilisateur non trouvé pour ID:', userId);
            }
          } catch (error) {
            participantsErrors.push({
              userId: userId,
              error: error.message
            });
            console.error(`❌ Erreur synchronisation utilisateur ${userId}:`, error.message);
          }
        }
      }

      // Récupérer l'UE mise à jour avec les informations du département
      const ueWithDepartement = await Ue.aggregate([
        { $match: { _id: savedUe._id } },
        {
          $lookup: {
            from: 'departement',
            localField: 'departementId',
            foreignField: '_id',
            as: 'departement'
          }
        },
        {
          $addFields: {
            departementNom: { $arrayElemAt: ['$departement.nom', 0] }
          }
        }
      ]);

      const formattedUe = {
        ...ueWithDepartement[0],
        id: ueWithDepartement[0]._id.toString(),
        participantCount: participantsResults.length
      };

      await logAction({
        action: 'create_ue',
        category: 'ue',
        userId: req.user ? req.user.userId : null,
        targetId: savedUe._id.toString(),
        details: {
          code: savedUe.code,
          intitule: savedUe.intitule,
          participantCount: participantsResults.length,
          participantsSynchronized: participantsResults.length,
          participantsErrors: participantsErrors.length,
          synchronized: true,
          success: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'UE créée avec succès et participants synchronisés !',
        ue: formattedUe,
        synchronization: {
          participantsAdded: participantsResults.length,
          participantsErrors: participantsErrors.length,
          details: participantsResults,
          errors: participantsErrors.length > 0 ? participantsErrors : undefined
        }
      });

    } catch (err) {
      console.error('❌ Error in createUe:', err);

      if (req.file) {
        const tempFile = path.join(__dirname, '../uploads/ue', req.file.filename);
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      }


      res.status(500).json({ success: false, message: 'Erreur lors de la création de l\'UE: ' + err.message });
    }
  }
];

// PUT /api/ue/:ueId → modifier une UE existante
// PUT /api/ue/:ueId → modifier une UE existante (CORRECTION ID UNDEFINED)
exports.updateUe = [
  upload.single('image'),

  async (req, res) => {
    const ueId = req.params.ueId;

    // ✅ VALIDATION DE L'ID EN PREMIER
    console.log(`🔍 updateUe appelé avec ueId:`, ueId);
    console.log(`📝 Type de ueId:`, typeof ueId);
    console.log(`📝 Valeur ueId:`, JSON.stringify(ueId));

    // Vérifier que l'ID n'est pas undefined, null ou vide
    if (!ueId || ueId === 'undefined' || ueId === 'null' || ueId.trim() === '') {
      console.error(`❌ ID d'UE invalide:`, ueId);
      return res.status(400).json({
        success: false,
        message: 'ID d\'UE manquant ou invalide'
      });
    }

    // Vérifier que c'est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(ueId)) {
      console.error(`❌ ID d'UE n'est pas un ObjectId valide:`, ueId);
      return res.status(400).json({
        success: false,
        message: 'Format d\'ID d\'UE invalide'
      });
    }

    try {
      const { code, intitule, description, ects, departement, assigned_users } = req.body;
      console.log(`📝 Body reçu:`, { code, intitule, description, ects, departement, assigned_users: assigned_users?.length });

      // Vérifier que l'UE existe
      const existingUe = await Ue.findById(ueId);
      if (!existingUe) {
        console.error(`❌ UE non trouvée pour ID:`, ueId);
        return res.status(404).json({
          success: false,
          message: 'UE non trouvée'
        });
      }

      console.log(`✅ UE trouvée: ${existingUe.code} - ${existingUe.intitule}`);

      // Vérifier si le code UE existe déjà (sauf pour l'UE courante)
      if (code && code.toUpperCase() !== existingUe.code) {
        const duplicateUe = await Ue.findOne({
          code: code.toUpperCase(),
          _id: { $ne: ueId }
        });
        if (duplicateUe) {
          return res.status(400).json({
            success: false,
            message: 'Ce code UE existe déjà'
          });
        }
      }

      // Gestion du département
      let departementId = existingUe.departementId;
      if (departement !== undefined) {
        if (departement === null || departement === '' || departement === 'null') {
          departementId = null;
        } else if (mongoose.Types.ObjectId.isValid(departement)) {
          const departementExists = await Departement.findById(departement);
          if (!departementExists) {
            return res.status(400).json({
              success: false,
              message: 'Département introuvable'
            });
          }
          departementId = new mongoose.Types.ObjectId(departement);
        } else {
          const departementExists = await Departement.findOne({
            $or: [
              { nom: departement },
              { code: departement }
            ]
          });

          if (departementExists) {
            departementId = departementExists._id;
          }
        }
      }

      // Préparer les données de mise à jour de base
      const updateData = {};
      if (code) updateData.code = code.toUpperCase();
      if (intitule) updateData.intitule = intitule;
      if (description !== undefined) updateData.description = description;
      if (ects) updateData.ects = parseInt(ects);
      if (departement !== undefined) updateData.departementId = departementId;
      updateData.updatedAt = new Date();

      // Traitement de l'image
      if (req.file) {
        // Créer le dossier s'il n'existe pas
        const nomUeSafe = (intitule || existingUe.intitule).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9-_]/g, "_").toLowerCase();
        const photoDir = path.join(__dirname, '../uploads/ue', nomUeSafe, 'photo');

        if (!fs.existsSync(photoDir)) {
          fs.mkdirSync(photoDir, { recursive: true });
        }

        // Déplacer le fichier vers le bon dossier
        const newImagePath = path.join(photoDir, req.file.filename);
        const tempPath = req.file.path;

        fs.renameSync(tempPath, newImagePath);

        // Supprimer l'ancienne image si elle existe
        if (existingUe.image) {
          const oldImagePath = path.join(__dirname, '../uploads', existingUe.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }

        updateData.image = `/uploads/ue/${nomUeSafe}/photo/${req.file.filename}`;
      }

      console.log(`📝 Données de base à mettre à jour:`, updateData);

      // ✨ GESTION DES PARTICIPANTS AVEC SYNCHRONISATION
      let synchronizationResult = null;

      if (assigned_users !== undefined) {
        console.log(`👥 Gestion des participants assignés:`, assigned_users);

        try {
          // Convertir assigned_users en tableau d'IDs valides
          const newUserIds = [];
          const invalidUsers = [];

          if (Array.isArray(assigned_users)) {
            for (const userId of assigned_users) {
              if (userId && userId.trim() !== '') {
                let user = null;

                // Recherche de l'utilisateur
                if (mongoose.Types.ObjectId.isValid(userId)) {
                  user = await Utilisateur.findById(userId);
                }
                if (!user) {
                  user = await Utilisateur.findOne({ id: userId });
                }
                if (!user && typeof userId === 'string') {
                  user = await Utilisateur.findOne({ email: userId });
                }

                if (user) {
                  newUserIds.push(user._id.toString());
                  console.log(`✅ Utilisateur trouvé: ${user.prenom} ${user.nom} (${user.email})`);
                } else {
                  invalidUsers.push(userId);
                  console.log(`⚠️ Utilisateur non trouvé: ${userId}`);
                }
              }
            }
          }

          console.log(`📊 Résumé participants:`);
          console.log(`  - Anciens: ${existingUe.participants.length}`);
          console.log(`  - Nouveaux valides: ${newUserIds.length}`);
          console.log(`  - Invalides: ${invalidUsers.length}`);

          // Obtenir les participants actuels
          const currentUserIds = existingUe.participants.map(id => id.toString());

          // Calculer les différences
          const usersToRemove = currentUserIds.filter(userId => !newUserIds.includes(userId));
          const usersToAdd = newUserIds.filter(userId => !currentUserIds.includes(userId));

          console.log(`🔄 Changements à effectuer:`);
          console.log(`  - À retirer: ${usersToRemove.length}`, usersToRemove);
          console.log(`  - À ajouter: ${usersToAdd.length}`, usersToAdd);

          const removeResults = [];
          const addResults = [];

          // Retirer les utilisateurs qui ne sont plus assignés
          for (const userId of usersToRemove) {
            try {
              console.log(`➖ Retrait de l'utilisateur ${userId}...`);
              await UeUserSyncService.removeUserFromUe(userId, ueId);
              removeResults.push({ userId, success: true });
              console.log(`✅ Utilisateur ${userId} retiré avec succès`);
            } catch (error) {
              console.error(`❌ Erreur retrait ${userId}:`, error.message);
              removeResults.push({ userId, success: false, error: error.message });
            }
          }

          // Ajouter les nouveaux utilisateurs
          for (const userId of usersToAdd) {
            try {
              console.log(`➕ Ajout de l'utilisateur ${userId}...`);
              await UeUserSyncService.addUserToUe(userId, ueId);
              addResults.push({ userId, success: true });
              console.log(`✅ Utilisateur ${userId} ajouté avec succès`);
            } catch (error) {
              console.error(`❌ Erreur ajout ${userId}:`, error.message);
              addResults.push({ userId, success: false, error: error.message });
            }
          }

          synchronizationResult = {
            usersRemoved: removeResults.filter(r => r.success).length,
            usersAdded: addResults.filter(r => r.success).length,
            removeErrors: removeResults.filter(r => !r.success),
            addErrors: addResults.filter(r => !r.success),
            invalidUsers: invalidUsers,
            synchronized: true
          };

          console.log(`🎉 Synchronisation terminée:`, synchronizationResult);

        } catch (syncError) {
          console.error('❌ Erreur lors de la synchronisation:', syncError);
          synchronizationResult = {
            error: syncError.message,
            synchronized: false
          };
        }
      }

      // Mettre à jour l'UE avec les données de base
      console.log(`🔄 Mise à jour de l'UE avec:`, updateData);
      const updatedUe = await Ue.findByIdAndUpdate(ueId, updateData, { new: true });

      if (!updatedUe) {
        return res.status(404).json({
          success: false,
          message: 'Erreur lors de la mise à jour de l\'UE'
        });
      }

      console.log(`✅ UE mise à jour: ${updatedUe.code} - ${updatedUe.intitule}`);

      // Récupérer l'UE mise à jour avec les informations du département
      const ueWithDepartement = await Ue.aggregate([
        { $match: { _id: updatedUe._id } },
        {
          $lookup: {
            from: 'departement',
            localField: 'departementId',
            foreignField: '_id',
            as: 'departement'
          }
        },
        {
          $addFields: {
            departementNom: { $arrayElemAt: ['$departement.nom', 0] }
          }
        }
      ]);

      const formattedUe = {
        ...ueWithDepartement[0],
        id: ueWithDepartement[0]._id.toString(),
        participantCount: ueWithDepartement[0].participants ? ueWithDepartement[0].participants.length : 0
      };

      // Logger l'action
      await logAction({
        action: 'update_ue',
        category: 'ue',
        userId: req.user ? req.user.userId : null,
        targetId: ueId,
        details: {
          oldCode: existingUe.code,
          newCode: updatedUe.code,
          oldIntitule: existingUe.intitule,
          newIntitule: updatedUe.intitule,
          participantCount: formattedUe.participantCount,
          synchronized: synchronizationResult ? synchronizationResult.synchronized : 'not_applicable',
          participantsChanged: synchronizationResult ?
            (synchronizationResult.usersAdded || 0) + (synchronizationResult.usersRemoved || 0) : 0,
          success: true
        }
      });

      const response = {
        success: true,
        message: 'UE mise à jour avec succès',
        ue: formattedUe
      };

      if (synchronizationResult) {
        response.synchronization = synchronizationResult;
      }

      console.log(`🎉 Réponse finale:`, {
        success: response.success,
        message: response.message,
        participants: formattedUe.participantCount,
        sync: synchronizationResult ? 'applied' : 'not_needed'
      });

      res.json(response);

    } catch (err) {
      console.error('❌ Error in updateUe:', err);

      // Nettoyer le fichier uploadé en cas d'erreur
      if (req.file) {
        const filePath = req.file.path;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'UE: ' + err.message
      });
    }
  }
];
// DELETE /api/ue/:ueId → supprimer une UE
exports.deleteUe = async (req, res) => {
  const ueId = req.params.ueId;
  console.log(`🗑️ deleteUe → ueId = ${ueId}`);

  try {
    // Utiliser le service de synchronisation pour supprimer proprement
    const result = await UeUserSyncService.deleteUeAndCleanUsers(ueId);

    // Logger l'action avec les détails du nettoyage
    await logAction({
      action: 'delete_ue',
      category: 'ue',
      userId: req.user ? req.user.userId : null,
      targetId: ueId,
      details: {
        code: result.deletedUe.code,
        intitule: result.deletedUe.intitule,
        participantCount: result.participantCount,
        usersCleanedCount: result.cleanedUsers.length,
        cleanedUsers: result.cleanedUsers,
        synchronized: true,
        success: true
      }
    });

    res.json({
      success: true,
      message: 'UE supprimée avec succès et utilisateurs mis à jour',
      details: {
        deletedUe: result.deletedUe,
        participantsAffected: result.participantCount,
        usersUpdated: result.cleanedUsers.length,
        cleanedUsers: result.cleanedUsers
      }
    });

  } catch (err) {
    console.error('❌ Error in deleteUe:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'UE: ' + err.message
    });
  }
};
// GET /api/ue/search → rechercher des UEs
exports.searchUes = async (req, res) => {
  try {
    const searchTerm = req.query.q;
    if (!searchTerm) {
      return res.json([]);
    }

    const searchRegex = new RegExp(searchTerm, 'i');
    const ues = await Ue.find({
      $or: [
        { code: searchRegex },
        { intitule: searchRegex },
        { description: searchRegex }
      ]
    }).sort({ code: 1 });

    const formattedUes = ues.map(ue => ({
      id: ue._id.toString(),
      code: ue.code,
      intitule: ue.intitule,
      image: ue.image,
      description: ue.description,
      ects: ue.ects,
      departementId: ue.departementId ? ue.departementId.toString() : null,
      participants: ue.participants || [],
      participantCount: ue.participants ? ue.participants.length : 0
    }));

    res.json(formattedUes);
  } catch (err) {
    console.error('Error in searchUes:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/ue/:ueId/participants → récupérer les participants d'une UE
exports.getParticipantsByUe = async (req, res) => {
  try {
    const ueId = req.params.ueId;

    // ✨ VALIDATION RENFORCÉE DE L'ID
    console.log(`🔍 Recherche participants pour UE: ${ueId}`);
    console.log(`📝 Type de ueId: ${typeof ueId}`);
    console.log(`📝 Valeur de ueId: ${JSON.stringify(ueId)}`);

    // Vérifier que l'ID n'est pas undefined, null ou vide
    if (!ueId || ueId === 'undefined' || ueId === 'null' || ueId.trim() === '') {
      console.error(`❌ ID d'UE invalide pour getParticipantsByUe:`, ueId);
      return res.status(400).json({
        success: false,
        message: 'ID d\'UE manquant ou invalide'
      });
    }

    // Vérifier que c'est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(ueId)) {
      console.error(`❌ ID d'UE n'est pas un ObjectId valide:`, ueId);
      return res.status(400).json({
        success: false,
        message: 'Format d\'ID d\'UE invalide'
      });
    }

    // Récupérer l'UE
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
      return res.status(404).json({
        success: false,
        message: 'UE non trouvée'
      });
    }

    console.log(`✅ UE trouvée: ${ue.code} - ${ue.intitule}`);
    console.log(`👥 Participants: ${ue.participants ? ue.participants.length : 0}`);

    if (!ue.participants || ue.participants.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Récupérer les informations des participants
    const participants = [];
    for (const participantId of ue.participants) {
      try {
        let utilisateur = null;

        // Recherche de l'utilisateur
        if (mongoose.Types.ObjectId.isValid(participantId)) {
          utilisateur = await Utilisateur.findById(participantId);
        }
        if (!utilisateur) {
          utilisateur = await Utilisateur.findOne({ id: participantId });
        }
        if (!utilisateur) {
          utilisateur = await Utilisateur.findOne({ email: participantId });
        }

        if (utilisateur) {
          const formattedParticipant = {
            _id: utilisateur._id.toString(),
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            email: utilisateur.email,
            photo: utilisateur.photo,
            role: Array.isArray(utilisateur.role) ? utilisateur.role : [utilisateur.role],
            ues: []
          };

          participants.push(formattedParticipant);
          console.log(`✅ Participant ajouté: ${utilisateur.prenom} ${utilisateur.nom}`);
        } else {
          console.log(`⚠️ Utilisateur non trouvé pour ID: ${participantId}`);
        }
      } catch (error) {
        console.error(`❌ Erreur récupération participant ${participantId}:`, error.message);
      }
    }

    console.log(`🎉 Total participants récupérés: ${participants.length}`);


    res.json({
      success: true,
      data: participants,
      ue: {
        id: ue._id.toString(),
        code: ue.code,
        intitule: ue.intitule,
        participantCount: participants.length
      }
    });

  } catch (err) {
    console.error('❌ Error in getParticipantsByUe:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: err.message
    });
  }
};

// POST /api/ue/:ueId/participants → ajouter un participant à une UE
exports.addParticipantToUe = async (req, res) => {
  try {
    const ueId = req.params.ueId;
    const { utilisateurId } = req.body;

    // ✨ VALIDATION DE L'ID
    if (!validateUeId(ueId, res, 'addParticipantToUe')) return;

    console.log(`Ajout participant UE ${ueId}, utilisateur ${utilisateurId}`);

    // Utiliser le service de synchronisation
    const result = await UeUserSyncService.addUserToUe(utilisateurId, ueId);

    await logAction({
      action: 'add_participant_ue',
      category: 'ue',
      userId: req.user ? req.user.userId : null,
      targetId: ueId,
      details: {
        participantId: utilisateurId,
        participantName: `${result.user.prenom} ${result.user.nom}`,
        success: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Participant ajouté avec succès (synchronisé)',
      data: {
        ue: result.ue.intitule,
        participant: `${result.user.prenom} ${result.user.nom}`
      }
    });

  } catch (err) {
    console.error('Error in addParticipantToUe:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: err.message
    });
  }
};
// DELETE /api/ue/:ueId/participants/:utilisateurId → retirer un participant d'une UE
exports.removeParticipantFromUe = async (req, res) => {
  try {
    const { ueId, utilisateurId } = req.params;

    // ✨ VALIDATION DE L'ID
    if (!validateUeId(ueId, res, 'removeParticipantFromUe')) return;

    console.log(`Retrait participant UE ${ueId}, utilisateur ${utilisateurId}`);

    // Utiliser le service de synchronisation
    const result = await UeUserSyncService.removeUserFromUe(utilisateurId, ueId);

    await logAction({
      action: 'remove_participant_ue',
      category: 'ue',
      userId: req.user ? req.user.userId : null,
      targetId: ueId,
      details: {
        participantId: utilisateurId,
        participantName: `${result.user.prenom} ${result.user.nom}`,
        success: true
      }
    });

    res.json({
      success: true,
      message: 'Participant retiré avec succès (synchronisé)'
    });

  } catch (err) {
    console.error('Error in removeParticipantFromUe:', err);

    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: err.message
    });
  }
};
// GET /api/ue/:ueId/participants/stats → statistiques des participants d'une UE
exports.getParticipantsStats = async (req, res) => {
  try {
    const ueId = req.params.ueId;

    // Récupérer l'UE
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
      return res.status(404).json({ message: 'UE non trouvée' });
    }

    const totalParticipants = ue.participants ? ue.participants.length : 0;

    if (totalParticipants === 0) {
      return res.json({
        success: true,
        data: {
          totalParticipants: 0,
          byStatus: [],
          byRole: []
        }
      });
    }

    // Récupérer les utilisateurs pour analyser leurs rôles
    const users = [];
    for (const participantId of ue.participants) {
      try {
        let user = null;
        if (mongoose.Types.ObjectId.isValid(participantId)) {
          user = await Utilisateur.findById(participantId);
        }
        if (!user) {
          user = await Utilisateur.findOne({ id: participantId });
        }
        if (user) {
          users.push(user);
        }
      } catch (error) {
        console.error(`Erreur récupération utilisateur ${participantId}:`, error.message);
      }
    }

    // Compter les participants par rôle
    const roleStats = {};
    users.forEach(user => {
      const roles = Array.isArray(user.role) ? user.role : [user.role];
      roles.forEach(role => {
        roleStats[role] = (roleStats[role] || 0) + 1;
      });
    });

    const roleStatsArray = Object.entries(roleStats).map(([role, count]) => ({
      _id: role,
      count: count
    }));

    // Pour les stats par statut, comme nous n'avons plus la table de liaison,
    // on considère tous les participants comme "actifs"
    const statusStats = [
      { _id: 'actif', count: totalParticipants }
    ];


    res.json({
      success: true,
      data: {
        totalParticipants: totalParticipants,
        byStatus: statusStats,
        byRole: roleStatsArray
      }
    });

  } catch (err) {
    console.error('Error in getParticipantsStats:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};


function validateUeId(ueId, res, actionName = 'action') {
  console.log(`🔍 Validation ID pour ${actionName}: ${ueId}`);
  console.log(`📝 Type: ${typeof ueId}, Valeur: ${JSON.stringify(ueId)}`);

  // Vérifier que l'ID n'est pas undefined, null ou vide
  if (!ueId || ueId === 'undefined' || ueId === 'null' || ueId.toString().trim() === '') {
    console.error(`❌ ID d'UE invalide pour ${actionName}:`, ueId);
    res.status(400).json({
      success: false,
      message: 'ID d\'UE manquant ou invalide'
    });
    return false;
  }

  // Vérifier que c'est un ObjectId valide
  if (!mongoose.Types.ObjectId.isValid(ueId)) {
    console.error(`❌ ID d'UE n'est pas un ObjectId valide pour ${actionName}:`, ueId);
    res.status(400).json({
      success: false,
      message: 'Format d\'ID d\'UE invalide'
    });
    return false;
  }

  return true;
}


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

    await logAction({
      action: 'get_all_ues',
      category: 'ue',
      userId: req.user ? req.user.userId : null,
      details: { success: true }
    });
    res.json(uesWithMetadata);
  } catch (err) {
    console.error('Error in getAllUes:', err);
    await logAction({
      action: 'get_all_ues_error',
      category: 'ue',
      userId: req.user? req.user.userId : null,
      details: { error: err.message }
    });
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

    await logAction({
      action: 'get_ue_by_id',
      category: 'ue',
      userId: req.user ? req.user.userId : null,
      targetId: ueId,
      details: { success: true }
    });
    res.json(formattedUe);
  } catch (err) {
    console.error('Error in getUeById:', err);
    await logAction({
      action: 'get_ue_by_id_error',
      category: 'ue',
      userId: req.user? req.user.userId : null,
      targetId: req.params.ueId,
      details: { error: err.message }
    });
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /api/ue → créer une nouvelle UE
exports.createUe = [
  upload.single('image'),
  async (req, res) => {
    try {
      const { code, intitule, description, ects, departement } = req.body;
      let assigned_users = req.body.assigned_users;

      // Convertir assigned_users en tableau
      if (assigned_users && !Array.isArray(assigned_users)) {
        assigned_users = [assigned_users];
      }

      console.log('📝 Création UE:', {
        code,
        intitule,
        hasImage: !!req.file,
        assignedUsers: assigned_users
      });

      // Vérifier si l'UE existe déjà
      const existingUe = await Ue.findOne({ code: code.toUpperCase() });
      if (existingUe) {
        return res.status(400).json({
          success: false,
          message: 'Ce code UE existe déjà'
        });
      }

      // Gérer l'image si elle existe
      let imageFilename = null;
      if (req.file) {
        try {
          const ueCode = code.trim().toUpperCase();
          const baseDir = path.join(__dirname, '../uploads/ue', ueCode);
          const photoDir = path.join(baseDir, 'photo');
          const postsDir = path.join(baseDir, 'posts');

          fs.mkdirSync(photoDir, { recursive: true });
          fs.mkdirSync(postsDir, { recursive: true });

          const newPath = path.join(photoDir, req.file.filename);
          fs.renameSync(req.file.path, newPath);
          imageFilename = `ue/${ueCode}/photo/${req.file.filename}`;
        } catch (imageError) {
          console.error('❌ Erreur traitement image:', imageError);
        }
      }

      // Créer l'UE
      const newUe = new Ue({
        code: code.toUpperCase(),
        intitule,
        description: description ? description.trim() : '',
        ects: parseInt(ects),
        departementId: departement,
        participants: assigned_users || [],
        image: imageFilename
      });

      const savedUe = await newUe.save();

      // Synchronisation immédiate après création
      await UeUserSyncService.syncAllUsersForUe(savedUe._id);
      console.log('✅ Synchronisation effectuée après création');

      const formattedUe = {
        ...savedUe.toObject(),
        id: savedUe._id.toString(),
        participants: assigned_users || []
      };

      await logAction({
        action: 'create_ue',
        category: 'ue',
        userId: req.user ? req.user.userId : null,
        targetId: savedUe._id.toString(),
        details: {
          code: savedUe.code,
          intitule: savedUe.intitule,
          assignedUsers: assigned_users,
          success: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'UE créée avec succès!',
        ue: formattedUe
      });

    } catch (err) {
      console.error('❌ Error in createUe:', err);

      // Nettoyer le fichier uploadé en cas d'erreur
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Erreur suppression fichier:', unlinkError);
        }
      }

      await logAction({
        action: 'create_ue_error',
        category: 'ue',
        userId: req.user ? req.user.userId : null,
        details: { error: err.message }
      });

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'UE: ' + err.message
      });
    }
  }
];


// PUT /api/ue/:ueId → modifier une UE existante
exports.updateUe = [
  upload.single('image'),
  async (req, res) => {
    try {
      const ueId = req.params.ueId;
      let { code, intitule, description, ects, departement, assigned_users } = req.body;

      // Convertir assigned_users en tableau s'il ne l'est pas déjà
      if (assigned_users && !Array.isArray(assigned_users)) {
        assigned_users = [assigned_users];
      }

      console.log('📝 Mise à jour UE:', {
        ueId,
        assigned_users
      });

      const existingUe = await Ue.findById(ueId);
      if (!existingUe) {
        return res.status(404).json({
          success: false,
          message: 'UE non trouvée'
        });
      }

      // Sauvegarder les anciens participants
      const oldParticipants = existingUe.participants.map(p => p.toString());

      // Préparer les nouveaux participants
      const newParticipants = (assigned_users || [])
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => id.toString());

      // Identifier les changements
      const participantsToAdd = newParticipants.filter(p => !oldParticipants.includes(p));
      const participantsToRemove = oldParticipants.filter(p => !newParticipants.includes(p));

      console.log('👥 Modifications participants:', {
        oldParticipants,
        newParticipants,
        toAdd: participantsToAdd,
        toRemove: participantsToRemove
      });

      // Mettre à jour les utilisateurs
      for (const userId of participantsToAdd) {
        const user = await Utilisateur.findById(userId);
        if (user && !user.ues.includes(ueId)) {
          user.ues.push(ueId);
          await user.save();
        }
      }

      for (const userId of participantsToRemove) {
        const user = await Utilisateur.findById(userId);
        if (user) {
          user.ues = user.ues.filter(id => id.toString() !== ueId);
          await user.save();
        }
      }

      // Mettre �� jour l'UE
      const updateData = {
        code: code || existingUe.code,
        intitule: intitule || existingUe.intitule,
        description: description !== undefined ? description : existingUe.description,
        ects: ects ? parseInt(ects) : existingUe.ects,
        departementId: departement || existingUe.departementId,
        participants: newParticipants,
        updatedAt: new Date()
      };

      const updatedUe = await Ue.findByIdAndUpdate(
        ueId,
        updateData,
        { new: true }
      );

      // Synchronisation immédiate après mise à jour
      await UeUserSyncService.syncAllUsersForUe(updatedUe._id);
      console.log('✅ Synchronisation effectuée après mise à jour');

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

      await logAction({
        action: 'update_ue',
        category: 'ue',
        userId: req.user ? req.user.userId : null,
        targetId: ueId,
        details: {
          success: true,
          participantsAdded: participantsToAdd.length,
          participantsRemoved: participantsToRemove.length
        }
      });

      res.json({
        success: true,
        message: 'UE mise �� jour avec succès',
        ue: formattedUe
      });

    } catch (err) {
      console.error('Error in updateUe:', err);

      if (req.file) {
        const filePath = path.join(__dirname, '../uploads/ue', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await logAction({
        action: 'update_ue_error',
        category: 'ue',
        userId: req.user ? req.user.userId : null,
        targetId: req.params.ueId,
        details: { error: err.message }
      });

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
    await logAction({
      action: 'delete_ue_error',
      category: 'ue',
      userId: req.user ? req.user.userId : null,
      targetId: ueId,
      details: { error: err.message }
    });
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

    await logAction({
      action: 'search_ues',
      category: 'ue',
      userId: req.user ? req.user.userId : null,
      details: { query: searchTerm, success: true }
    });
    res.json(formattedUes);
  } catch (err) {
    console.error('Error in searchUes:', err);
    await logAction({
      action:'search_ues_error',
      category: 'ue',
      userId: req.user? req.user.userId : null,
      details: { error: err.message }
    });
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/ue/:ueId/participants → récupérer les participants d'une UE
exports.getParticipantsByUe = async (req, res) => {
  try {
    const ueId = req.params.ueId;
    console.log(`🔍 Recherche participants pour UE: ${ueId}`);

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

    await logAction({
      action: 'get_participants_by_ue',
      category: 'user',
      userId: req.user ? req.user.userId : null,
      targetId: ue._id.toString(),
      details: {
        ueCode: ue.code,
        ueIntitule: ue.intitule,
        participantCount: ue.participants ? ue.participants.length : 0,
        success: true
      }
    });

  } catch (err) {
    console.error('❌ Error in getParticipantsByUe:', err);
    await logAction({
      action: 'get_participants_by_ue_error',
      category: 'ue',
      userId: req.user ? req.user.userId : null,
      targetId: req.params.ueId,
      details: { error: err.message }
    });
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

    await UeUserSyncService.addUserToUe(utilisateurId, ueId);
    await UeUserSyncService.syncAllUsersForUe(ueId);
    console.log('✅ Synchronisation effectuée après ajout participant');

    await logAction({
      action: 'add_participant_ue',
      category: 'ue',
      userId: req.user ? req.user.userId : null,
      targetId: ueId,
      details: { success: true }
    });

    res.status(201).json({
      success: true,
      message: 'Participant ajouté avec succès',
      data: result
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

    await UeUserSyncService.removeUserFromUe(utilisateurId, ueId);
    await UeUserSyncService.syncAllUsersForUe(ueId);
    console.log('✅ Synchronisation effectuée après retrait participant');

    await logAction({
      action: 'remove_participant_ue',
      category: 'ue',
      userId: req.user ? req.user.userId : null,
      targetId: ueId,
      details: { success: true }
    });

    res.json({
      success: true,
      message: 'Participant retiré avec succès',
      data: result
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

    await logAction({
      action: 'get_participants_stats',
      category: 'ue',
      userId: req.user ? req.user.userId : null,
      targetId: ueId,
      details: { success: true }
    });
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
    await logAction({
      action: 'get_participants_stats_error',
      category: 'ue',
      userId: req.user? req.user.userId : null,
      targetId: req.params.ueId,
      details: { error: err.message }
    });
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

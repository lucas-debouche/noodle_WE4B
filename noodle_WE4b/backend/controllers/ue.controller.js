const mongoose = require('mongoose');
const Utilisateur = require('../models/utilisateur.model');
const Ue = require('../models/ue.model');
const UtilisateurUe = require('../models/utilisateur_ue.model');
const Departement = require('../models/departement.model'); // Nouveau modèle
const { logAction } = require("../utils/logActions");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration Multer pour les images d'UE
const storage = multer.diskStorage({
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
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
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

    // Ajouter le nombre de participants pour chaque UE
    const uesWithParticipants = await Promise.all(
      ues.map(async (ue) => {
        const participantCount = await UtilisateurUe.countDocuments({ ue_id: ue._id.toString() });
        return {
          ...ue,
          id: ue._id.toString(),
          participants: Array(participantCount).fill().map((_, i) => i.toString()), // Mock pour compatibilité
          participantCount
        };
      })
    );

    res.json(uesWithParticipants);
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
    console.log('createUe → req.body =', req.body);
    console.log('createUe → req.file =', req.file);

    try {
      const { code, intitule, description, ects, departement, assigned_users } = req.body;

      // Vérifier si le code UE existe déjà
      const existingUe = await Ue.findOne({ code: code.toUpperCase() });
      if (existingUe) {
        return res.status(400).json({
          success: false,
          message: 'Ce code UE existe déjà'
        });
      }

      // Vérifier si le département existe
      let departementId = null;
      if (departement) {
        const departementExists = await Departement.findById(departement);
        if (!departementExists) {
          return res.status(400).json({
            success: false,
            message: 'Département introuvable'
          });
        }
        departementId = departement;
      }

      // Traitement de l'image
      let imageFilename = null;
      if (req.file) {
        imageFilename = req.file.filename;
      }

      // Créer la nouvelle UE
      const newUe = new Ue({
        code: code.toUpperCase(),
        intitule,
        description: description || '',
        ects: parseInt(ects),
        image: imageFilename,
        departementId: departementId ? new mongoose.Types.ObjectId(departementId) : null
      });

      const savedUe = await newUe.save();

      // Affecter des utilisateurs à l'UE si fournis
      if (assigned_users && Array.isArray(assigned_users)) {
        for (const userId of assigned_users) {
          try {
            // Vérifier que l'utilisateur existe
            const user = await Utilisateur.findById(userId);
            if (user) {
              const relation = new UtilisateurUe({
                utilisateur_id: userId,
                ue_id: savedUe._id.toString(),
                statut: 'actif',
                date_inscription: new Date()
              });
              await relation.save();
            }
          } catch (error) {
            console.error(`Erreur lors de l'assignation de l'utilisateur ${userId}:`, error);
          }
        }
      }

      // Logger l'action
      await logAction({
        action: 'create_ue',
        category: 'ue',
        userId: req.user ? req.user.userId : null,
        targetId: savedUe._id.toString(),
        details: { code: savedUe.code, intitule: savedUe.intitule }
      });

      // Récupérer l'UE créée avec les informations du département
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
        id: ueWithDepartement[0]._id.toString()
      };

      res.status(201).json({
        success: true,
        message: 'UE créée avec succès!',
        ue: formattedUe
      });

    } catch (err) {
      console.error('Error in createUe:', err);

      // Nettoyer le fichier uploadé en cas d'erreur
      if (req.file) {
        const filePath = path.join(__dirname, '../uploads/ue', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

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
    const ueId = req.params.ueId;
    console.log(`updateUe → ueId = ${ueId}`, req.body);

    try {
      const { code, intitule, description, ects, departement, assigned_users } = req.body;

      // Vérifier que l'UE existe
      const existingUe = await Ue.findById(ueId);
      if (!existingUe) {
        return res.status(404).json({
          success: false,
          message: 'UE non trouvée'
        });
      }

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

      // Vérifier le département si fourni
      let departementId = existingUe.departementId;
      if (departement !== undefined) {
        if (departement) {
          const departementExists = await Departement.findById(departement);
          if (!departementExists) {
            return res.status(400).json({
              success: false,
              message: 'Département introuvable'
            });
          }
          departementId = new mongoose.Types.ObjectId(departement);
        } else {
          departementId = null;
        }
      }

      // Préparer les données de mise à jour
      const updateData = {};
      if (code) updateData.code = code.toUpperCase();
      if (intitule) updateData.intitule = intitule;
      if (description !== undefined) updateData.description = description;
      if (ects) updateData.ects = parseInt(ects);
      if (departement !== undefined) updateData.departementId = departementId;
      updateData.updatedAt = new Date();

      // Traitement de l'image
      if (req.file) {
        // Supprimer l'ancienne image si elle existe
        if (existingUe.image) {
          const oldImagePath = path.join(__dirname, '../uploads/ue', existingUe.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        updateData.image = req.file.filename;
      }

      // Mettre à jour l'UE
      const updatedUe = await Ue.findByIdAndUpdate(ueId, updateData, { new: true });

      // Mettre à jour les utilisateurs assignés
      if (assigned_users !== undefined) {
        // Supprimer toutes les anciennes relations
        await UtilisateurUe.deleteMany({ ue_id: ueId });

        // Ajouter les nouvelles relations
        if (Array.isArray(assigned_users)) {
          for (const userId of assigned_users) {
            try {
              const user = await Utilisateur.findById(userId);
              if (user) {
                const relation = new UtilisateurUe({
                  utilisateur_id: userId,
                  ue_id: ueId,
                  statut: 'actif',
                  date_inscription: new Date()
                });
                await relation.save();
              }
            } catch (error) {
              console.error(`Erreur lors de l'assignation de l'utilisateur ${userId}:`, error);
            }
          }
        }
      }

      // Logger l'action
      await logAction({
        action: 'update_ue',
        category: 'ue',
        userId: req.user ? req.user.userId : null,
        targetId: ueId,
        details: {
          oldCode: existingUe.code,
          newCode: updateData.code || existingUe.code,
          oldIntitule: existingUe.intitule,
          newIntitule: updateData.intitule || existingUe.intitule
        }
      });

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
        id: ueWithDepartement[0]._id.toString()
      };

      res.json({
        success: true,
        message: 'UE mise à jour avec succès',
        ue: formattedUe
      });

    } catch (err) {
      console.error('Error in updateUe:', err);

      // Nettoyer le fichier uploadé en cas d'erreur
      if (req.file) {
        const filePath = path.join(__dirname, '../uploads/ue', req.file.filename);
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
  console.log(`deleteUe → ueId = ${ueId}`);

  try {
    const ue = await Ue.findById(ueId);
    if (!ue) {
      return res.status(404).json({
        success: false,
        message: 'UE non trouvée'
      });
    }

    // Supprimer l'image associée
    if (ue.image) {
      const imagePath = path.join(__dirname, '../uploads/ue', ue.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Supprimer toutes les relations utilisateur-UE
    await UtilisateurUe.deleteMany({ ue_id: ueId });

    // Supprimer l'UE
    await Ue.findByIdAndDelete(ueId);

    // Logger l'action
    await logAction({
      action: 'delete_ue',
      category: 'ue',
      userId: req.user ? req.user.userId : null,
      targetId: ueId,
      details: { code: ue.code, intitule: ue.intitule }
    });

    res.json({
      success: true,
      message: 'UE supprimée avec succès'
    });

  } catch (err) {
    console.error('Error in deleteUe:', err);
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
      departementId: ue.departementId ? ue.departementId.toString() : null
    }));

    res.json(formattedUes);
  } catch (err) {
    console.error('Error in searchUes:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/ue/:ueId/participants → récupérer les participants d'une UE via la table de liaison
exports.getParticipantsByUe = async (req, res) => {
  try {
    const ueId = req.params.ueId;

    // DEBUG: Vérifier toutes les relations dans la collection
    const allRelations = await UtilisateurUe.find({});
    allRelations.slice(0, 5).forEach((rel, index) => {
      console.log(`Relation ${index}:`, { utilisateur_id: rel.utilisateur_id, ue_id: rel.ue_id });
    });

    // 1. Récupérer toutes les relations utilisateur_ue pour cette UE
    let relations = await UtilisateurUe.find({ ue_id: ueId });

    // Si pas trouvé, essayer comme string
    if (relations.length === 0) {
      relations = await UtilisateurUe.find({ ue_id: ueId.toString() });
    }

    // Si pas trouvé, essayer comme number
    if (relations.length === 0 && !isNaN(ueId)) {
      relations = await UtilisateurUe.find({ ue_id: parseInt(ueId) });
    }

    console.log(`Relations trouvées pour UE ${ueId}:`, relations.length);

    if (relations.length === 0) {
      console.log(`⚠️ Aucune relation trouvée pour ue_id="${ueId}"`);
      return res.json({
        success: true,
        data: [],
        debug: {
          searchedUeId: ueId,
          totalRelationsInDB: allRelations.length,
          availableUeIds: [...new Set(allRelations.map(r => r.ue_id))]
        }
      });
    }

    // 2. Extraire les IDs des utilisateurs
    const userIds = relations.map(rel => rel.utilisateur_id);

    // 3. Récupérer les utilisateurs correspondants
    const participants = [];

    for (const userId of userIds) {
      try {
        let utilisateur;

        // CORRECTION : Chercher par le champ "id" personnalisé (pas "_id")
        utilisateur = await Utilisateur.findOne({ id: userId });

        // Si pas trouvé avec le champ "id", essayer avec _id si c'est un ObjectId valide
        if (!utilisateur && mongoose.Types.ObjectId.isValid(userId)) {
          utilisateur = await Utilisateur.findById(userId);
        }

        if (utilisateur) {
          // Récupérer les métadonnées de la relation
          const relation = relations.find(rel => rel.utilisateur_id === userId);

          // Formater selon l'interface frontend
          const formattedParticipant = {
            id: utilisateur._id.toString(),
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            email: utilisateur.email,
            photo: utilisateur.photo,
            role: Array.isArray(utilisateur.role) ? utilisateur.role : [utilisateur.role],
            ues: [], // À remplir si nécessaire
            // Métadonnées de la relation utilisateur_ue
            dateInscription: relation?.date_inscription || relation?.createdAt,
            statut: relation?.statut || 'actif',
            promotion: relation?.promotion,
            specialite: relation?.specialite,
            noteFinale: relation?.note_finale,
            presence: relation?.presence
          };

          participants.push(formattedParticipant);
        } else {
          console.log(`⚠️ Utilisateur non trouvé pour ID: ${userId}`);

          // DEBUG: Afficher quelques utilisateurs pour voir leur structure (seulement pour le premier)
          if (userId === userIds[0]) {
            const sampleUsers = await Utilisateur.find({}).limit(3);
            console.log(`📋 Exemples d'utilisateurs dans la BDD :`);
            sampleUsers.forEach(u => {
              console.log(`  - _id: ${u._id}, id: ${u.id}, nom: ${u.nom}, email: ${u.email}`);
            });
          }
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la récupération du participant ${userId}:`, error.message);
      }
    }

    res.json({
      success: true,
      data: participants
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

// POST /api/ue/:ueId/participants → ajouter un participant à une UE via la table de liaison
exports.addParticipantToUe = async (req, res) => {
  try {
    const ueId = req.params.ueId;
    const { utilisateurId, promotion, specialite, statut } = req.body;

    console.log(`Ajout participant UE ${ueId}, utilisateur ${utilisateurId}`);

    // Vérifier que l'UE existe
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

    // Vérifier que l'utilisateur existe
    let utilisateur;
    if (mongoose.Types.ObjectId.isValid(utilisateurId)) {
      utilisateur = await Utilisateur.findById(utilisateurId);
    }

    if (!utilisateur) {
      utilisateur = await Utilisateur.findOne({ id: utilisateurId });
    }

    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si la relation existe déjà
    const existingRelation = await UtilisateurUe.findOne({
      utilisateur_id: utilisateur.id || utilisateur._id.toString(),
      ue_id: ueId
    });

    if (existingRelation) {
      return res.status(400).json({ message: 'Utilisateur déjà inscrit à cette UE' });
    }

    // Créer la nouvelle relation
    const newRelation = new UtilisateurUe({
      utilisateur_id: utilisateur.id || utilisateur._id.toString(),
      ue_id: ueId,
      statut: statut || 'actif',
      promotion: promotion,
      specialite: specialite,
      date_inscription: new Date()
    });

    await newRelation.save();

    // Logger l'action
    await logAction({
      action: 'add_participant_ue',
      category: 'ue',
      userId: req.user ? req.user.userId : null,
      targetId: ueId,
      details: {
        participantId: utilisateur._id.toString(),
        participantName: `${utilisateur.prenom} ${utilisateur.nom}`
      }
    });

    res.status(201).json({
      success: true,
      message: 'Participant ajouté avec succès',
      data: {
        ue: ue.intitule,
        participant: `${utilisateur.prenom} ${utilisateur.nom}`,
        relation: newRelation
      }
    });

  } catch (err) {
    console.error('Error in addParticipantToUe:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /api/ue/:ueId/participants/:utilisateurId → retirer un participant d'une UE
exports.removeParticipantFromUe = async (req, res) => {
  try {
    const { ueId, utilisateurId } = req.params;

    console.log(`Retrait participant UE ${ueId}, utilisateur ${utilisateurId}`);

    // Supprimer la relation
    const result = await UtilisateurUe.deleteOne({
      utilisateur_id: utilisateurId,
      ue_id: ueId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Relation utilisateur-UE non trouvée' });
    }

    // Logger l'action
    await logAction({
      action: 'remove_participant_ue',
      category: 'ue',
      userId: req.user ? req.user.userId : null,
      targetId: ueId,
      details: { participantId: utilisateurId }
    });

    res.json({
      success: true,
      message: 'Participant retiré avec succès'
    });

  } catch (err) {
    console.error('Error in removeParticipantFromUe:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/ue/:ueId/participants/stats → statistiques des participants d'une UE
exports.getParticipantsStats = async (req, res) => {
  try {
    const ueId = req.params.ueId;

    // Compter les participants par statut
    const stats = await UtilisateurUe.aggregate([
      { $match: { ue_id: ueId } },
      {
        $group: {
          _id: '$statut',
          count: { $sum: 1 }
        }
      }
    ]);

    // Compter les participants par rôle
    const relations = await UtilisateurUe.find({ ue_id: ueId });
    const userIds = relations.map(rel => rel.utilisateur_id);

    // Adapter la recherche des utilisateurs pour les stats
    const users = [];
    for (const userId of userIds) {
      let user = await Utilisateur.findOne({ id: userId });
      if (!user && mongoose.Types.ObjectId.isValid(userId)) {
        user = await Utilisateur.findById(userId);
      }
      if (user) {
        users.push(user);
      }
    }

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

    res.json({
      success: true,
      data: {
        totalParticipants: relations.length,
        byStatus: stats,
        byRole: roleStatsArray
      }
    });

  } catch (err) {
    console.error('Error in getParticipantsStats:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

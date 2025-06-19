const mongoose = require('mongoose');
const Utilisateur = require('../models/utilisateur.model');
const Ue = require('../models/ue.model');
const Departement = require('../models/departement.model');
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
    console.log('📝 createUe → req.body =', req.body);
    console.log('📁 createUe → req.file =', req.file);

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

      // Gestion du département
      let departementId = null;
      console.log('🏢 Département reçu:', departement, 'Type:', typeof departement);

      if (departement && departement !== 'null' && departement !== '' && departement !== 'undefined') {
        if (mongoose.Types.ObjectId.isValid(departement)) {
          console.log('✅ ObjectId valide détecté');
          const departementExists = await Departement.findById(departement);
          if (departementExists) {
            departementId = new mongoose.Types.ObjectId(departement);
            console.log('✅ Département trouvé par ObjectId:', departementExists.nom);
          }
        } else {
          console.log('🔍 Recherche département par nom/code:', departement);
          const departementExists = await Departement.findOne({
            $or: [
              { nom: new RegExp(departement, 'i') },
              { code: departement.toUpperCase() }
            ]
          });

          if (departementExists) {
            departementId = departementExists._id;
            console.log('✅ Département trouvé par recherche:', departementExists.nom);
          }
        }
      }

      // Traitement de l'image
      let imageFilename = null;
      if (req.file) {
        imageFilename = req.file.filename;
        console.log('🖼️ Image uploadée:', imageFilename);
      }

      // Traitement des utilisateurs assignés
      let participants = [];
      if (assigned_users && Array.isArray(assigned_users)) {
        console.log('👥 Traitement des utilisateurs assignés:', assigned_users.length);

        for (const userId of assigned_users) {
          try {
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
              // Utiliser l'ID MongoDB pour cohérence
              participants.push(user._id.toString());
              console.log('✅ Utilisateur ajouté:', user.email);
            } else {
              console.log('⚠️ Utilisateur non trouvé pour ID:', userId);
            }
          } catch (error) {
            console.error(`❌ Erreur traitement utilisateur ${userId}:`, error.message);
          }
        }
      }

      // Créer la nouvelle UE
      const newUe = new Ue({
        code: code.toUpperCase(),
        intitule,
        description: description ? description.trim() : '',
        ects: parseInt(ects),
        image: imageFilename,
        departementId: departementId,
        participants: participants
      });

      console.log('💾 Sauvegarde UE:', {
        code: newUe.code,
        intitule: newUe.intitule,
        departementId: newUe.departementId,
        participantCount: newUe.participants.length
      });

      const savedUe = await newUe.save();
      console.log('✅ UE sauvegardée avec succès:', savedUe._id);

      // Logger l'action
      await logAction({
        action: 'create_ue',
        category: 'ue',
        userId: req.user ? req.user.userId : null,
        targetId: savedUe._id.toString(),
        details: {
          code: savedUe.code,
          intitule: savedUe.intitule,
          participantCount: savedUe.participants.length
        }
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
        id: ueWithDepartement[0]._id.toString(),
        participantCount: ueWithDepartement[0].participants ? ueWithDepartement[0].participants.length : 0
      };

      res.status(201).json({
        success: true,
        message: 'UE créée avec succès!',
        ue: formattedUe
      });

    } catch (err) {
      console.error('❌ Error in createUe:', err);

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

      // Traitement des utilisateurs assignés
      if (assigned_users !== undefined) {
        console.log('👥 Mise à jour des utilisateurs assignés');

        let participants = [];
        if (Array.isArray(assigned_users) && assigned_users.length > 0) {
          for (const userId of assigned_users) {
            try {
              let user = null;

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
                participants.push(user._id.toString());
                console.log('✅ Utilisateur ajouté:', user.email);
              } else {
                console.log('⚠️ Utilisateur non trouvé pour ID:', userId);
              }
            } catch (error) {
              console.error(`❌ Erreur traitement utilisateur ${userId}:`, error.message);
            }
          }
        }
        updateData.participants = participants;
      }

      // Mettre à jour l'UE
      const updatedUe = await Ue.findByIdAndUpdate(ueId, updateData, { new: true });

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
          newIntitule: updateData.intitule || existingUe.intitule,
          participantCount: updatedUe.participants ? updatedUe.participants.length : 0
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
        id: ueWithDepartement[0]._id.toString(),
        participantCount: ueWithDepartement[0].participants ? ueWithDepartement[0].participants.length : 0
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
  console.log(`🗑️ deleteUe → ueId = ${ueId}`);

  try {
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
      console.log(`❌ UE non trouvée pour ID: ${ueId}`);
      return res.status(404).json({
        success: false,
        message: 'UE non trouvée'
      });
    }

    console.log(`✅ UE trouvée: ${ue.code} - ${ue.intitule}`);

    // Supprimer l'image associée
    if (ue.image) {
      const imagePath = path.join(__dirname, '../uploads/ue', ue.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('✅ Image supprimée:', ue.image);
      }
    }

    // Supprimer l'UE
    await Ue.findByIdAndDelete(ue._id);
    console.log('✅ UE supprimée de la base de données');

    // Logger l'action
    await logAction({
      action: 'delete_ue',
      category: 'ue',
      userId: req.user ? req.user.userId : null,
      targetId: ue._id.toString(),
      details: {
        code: ue.code,
        intitule: ue.intitule,
        participantCount: ue.participants ? ue.participants.length : 0
      }
    });

    res.json({
      success: true,
      message: 'UE supprimée avec succès'
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
            id: utilisateur._id.toString(),
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

// POST /api/ue/:ueId/participants → ajouter un participant à une UE
exports.addParticipantToUe = async (req, res) => {
  try {
    const ueId = req.params.ueId;
    const { utilisateurId } = req.body;

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

    // Vérifier si l'utilisateur est déjà participant
    const userIdStr = utilisateur._id.toString();
    if (ue.participants && ue.participants.includes(userIdStr)) {
      return res.status(400).json({ message: 'Utilisateur déjà inscrit à cette UE' });
    }

    // Ajouter le participant
    if (!ue.participants) {
      ue.participants = [];
    }
    ue.participants.push(userIdStr);
    await ue.save();

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
        participant: `${utilisateur.prenom} ${utilisateur.nom}`
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

    // Retirer le participant de la liste
    const userIdStr = utilisateur._id.toString();
    if (!ue.participants || !ue.participants.includes(userIdStr)) {
      return res.status(404).json({ message: 'Utilisateur non inscrit à cette UE' });
    }

    ue.participants = ue.participants.filter(id => id !== userIdStr);
    await ue.save();

    // Logger l'action
    await logAction({
      action: 'remove_participant_ue',
      category: 'ue',
      userId: req.user ? req.user.userId : null,
      targetId: ueId,
      details: {
        participantId: utilisateur._id.toString(),
        participantName: `${utilisateur.prenom} ${utilisateur.nom}`
      }
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

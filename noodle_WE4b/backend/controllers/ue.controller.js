const mongoose = require('mongoose');
const Utilisateur = require('../models/utilisateur.model');
const Ue = require('../models/ue.model');
const UtilisateurUe = require('../models/utilisateur_ue.model');
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

      // ✅ GESTION ULTRA-ROBUSTE DU DÉPARTEMENT
      let departementId = null;

      console.log('🏢 Département reçu:', departement, 'Type:', typeof departement);

      if (departement && departement !== 'null' && departement !== '' && departement !== 'undefined') {
        // Cas 1: C'est un ObjectId valide
        if (mongoose.Types.ObjectId.isValid(departement)) {
          console.log('✅ ObjectId valide détecté');
          const departementExists = await Departement.findById(departement);
          if (departementExists) {
            departementId = new mongoose.Types.ObjectId(departement);
            console.log('✅ Département trouvé par ObjectId:', departementExists.nom);
          } else {
            console.log('⚠️ ObjectId valide mais département non trouvé');
          }
        }
        // Cas 2: C'est un ID simple (comme "1", "2", etc.) - On ignore silencieusement
        else if (departement.match(/^[0-9]+$/)) {
          console.log('⚠️ ID numérique simple détecté, ignoré car non-MongoDB:', departement);
          departementId = null;
        }
        // Cas 3: Recherche par nom ou code
        else {
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
          } else {
            console.log('⚠️ Département non trouvé par recherche');
          }
        }
      } else {
        console.log('📝 Aucun département spécifié');
      }

      console.log('🎯 Département final:', departementId);

      // Traitement de l'image
      let imageFilename = null;
      if (req.file) {
        imageFilename = req.file.filename;
        console.log('🖼️ Image uploadée:', imageFilename);
      }

      // Créer la nouvelle UE
      const newUe = new Ue({
        code: code.toUpperCase(),
        intitule,
        description: description || '',
        ects: parseInt(ects),
        image: imageFilename,
        departementId: departementId // Peut être null
      });

      console.log('💾 Sauvegarde UE:', {
        code: newUe.code,
        intitule: newUe.intitule,
        departementId: newUe.departementId
      });

      const savedUe = await newUe.save();
      console.log('✅ UE sauvegardée avec succès:', savedUe._id);

      // ✅ CORRECTION: Affecter des utilisateurs à l'UE si fournis
      if (assigned_users && Array.isArray(assigned_users)) {
        console.log('👥 Assignation utilisateurs:', assigned_users.length, 'utilisateurs');

        for (const userId of assigned_users) {
          try {
            console.log('🔍 Recherche utilisateur avec ID:', userId, 'Type:', typeof userId);

            let user = null;

            // Cas 1: Essayer avec ObjectId si c'est un ObjectId valide
            if (mongoose.Types.ObjectId.isValid(userId)) {
              console.log('✅ ObjectId valide, recherche par _id');
              user = await Utilisateur.findById(userId);
            }

            // Cas 2: Si pas trouvé et que ce n'est pas un ObjectId, chercher par le champ "id" personnalisé
            if (!user) {
              console.log('🔍 Recherche par champ id personnalisé');
              user = await Utilisateur.findOne({ id: userId });
            }

            // Cas 3: Si toujours pas trouvé, chercher par email ou autres critères
            if (!user && typeof userId === 'string') {
              console.log('🔍 Recherche par email');
              user = await Utilisateur.findOne({ email: userId });
            }

            if (user) {
              console.log('✅ Utilisateur trouvé:', user.email);

              // Utiliser l'ID approprié pour la relation
              const userIdForRelation = user.id || user._id.toString();

              const relation = new UtilisateurUe({
                utilisateur_id: userIdForRelation,
                ue_id: savedUe._id.toString(),
                statut: 'actif',
                date_inscription: new Date()
              });

              await relation.save();
              console.log('✅ Relation utilisateur-UE créée');

            } else {
              console.log('⚠️ Utilisateur non trouvé pour ID:', userId);
            }

          } catch (error) {
            console.error(`❌ Erreur assignation utilisateur ${userId}:`, error.message);
            // Continuer avec les autres utilisateurs même si un échoue
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

      console.log('🎉 Réponse envoyée:', {
        success: true,
        code: formattedUe.code,
        departement: formattedUe.departementNom || 'Aucun'
      });

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

      // ✅ CORRECTION: Gestion améliorée du département
      let departementId = existingUe.departementId;
      if (departement !== undefined) {
        if (departement === null || departement === '' || departement === 'null') {
          // Retirer le département
          departementId = null;
        } else {
          // Vérifier si c'est un ObjectId valide
          if (mongoose.Types.ObjectId.isValid(departement)) {
            const departementExists = await Departement.findById(departement);
            if (!departementExists) {
              return res.status(400).json({
                success: false,
                message: 'Département introuvable'
              });
            }
            departementId = new mongoose.Types.ObjectId(departement);
          } else {
            // Si ce n'est pas un ObjectId valide, essayer de chercher par nom ou code
            const departementExists = await Departement.findOne({
              $or: [
                { nom: departement },
                { code: departement }
              ]
            });

            if (departementExists) {
              departementId = departementExists._id;
            } else {
              console.log(`⚠️ Département non trouvé pour: "${departement}"`);
              // Ne pas changer le département existant si on ne trouve pas le nouveau
              // departementId reste inchangé
            }
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

      // Mettre à jour l'UE
      const updatedUe = await Ue.findByIdAndUpdate(ueId, updateData, { new: true });

      // ✅ CORRECTION: Mettre à jour les utilisateurs assignés
      if (assigned_users !== undefined) {
        console.log('👥 Mise à jour des utilisateurs assignés');

        // Supprimer toutes les anciennes relations
        await UtilisateurUe.deleteMany({ ue_id: ueId });
        console.log('🗑️ Anciennes relations supprimées');

        // Ajouter les nouvelles relations
        if (Array.isArray(assigned_users) && assigned_users.length > 0) {
          console.log('➕ Ajout de', assigned_users.length, 'nouvelles relations');

          for (const userId of assigned_users) {
            try {
              console.log('🔍 Recherche utilisateur avec ID:', userId, 'Type:', typeof userId);

              let user = null;

              // Cas 1: Essayer avec ObjectId si c'est un ObjectId valide
              if (mongoose.Types.ObjectId.isValid(userId)) {
                console.log('✅ ObjectId valide, recherche par _id');
                user = await Utilisateur.findById(userId);
              }

              // Cas 2: Si pas trouvé et que ce n'est pas un ObjectId, chercher par le champ "id" personnalisé
              if (!user) {
                console.log('🔍 Recherche par champ id personnalisé');
                user = await Utilisateur.findOne({ id: userId });
              }

              // Cas 3: Si toujours pas trouvé, chercher par email
              if (!user && typeof userId === 'string') {
                console.log('🔍 Recherche par email');
                user = await Utilisateur.findOne({ email: userId });
              }

              if (user) {
                console.log('✅ Utilisateur trouvé:', user.email);

                // Utiliser l'ID approprié pour la relation
                const userIdForRelation = user.id || user._id.toString();

                const relation = new UtilisateurUe({
                  utilisateur_id: userIdForRelation,
                  ue_id: ueId,
                  statut: 'actif',
                  date_inscription: new Date()
                });

                await relation.save();
                console.log('✅ Nouvelle relation utilisateur-UE créée');

              } else {
                console.log('⚠️ Utilisateur non trouvé pour ID:', userId);
              }

            } catch (error) {
              console.error(`❌ Erreur assignation utilisateur ${userId}:`, error.message);
              // Continuer avec les autres utilisateurs même si un échoue
            }
          }
        } else {
          console.log('📝 Aucun utilisateur à assigner');
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
  console.log(`🗑️ deleteUe → ueId = ${ueId}`);

  try {
    // Vérifier que l'UE existe
    let ue;

    // Essayer de trouver par _id (ObjectId)
    if (mongoose.Types.ObjectId.isValid(ueId)) {
      ue = await Ue.findById(ueId);
    }

    // Si pas trouvé, essayer par le champ "id" personnalisé
    if (!ue) {
      ue = await Ue.findOne({ id: ueId });
    }

    // Si toujours pas trouvé, essayer par code
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

    // ✅ CORRECTION: Suppression sans transaction pour MongoDB standalone
    try {
      // 1. Supprimer les relations utilisateur-UE
      const deleteResult = await UtilisateurUe.deleteMany({ ue_id: ue._id.toString() });
      console.log(`✅ ${deleteResult.deletedCount} relations utilisateur-UE supprimées`);

      // 2. Supprimer les posts/forums liés si nécessaire
      // Uncomment if you have these collections:
      // await Post.deleteMany({ ue_id: ue._id.toString() });
      // await Forum.deleteMany({ ueId: ue._id.toString() });

      // 3. Supprimer l'image associée
      if (ue.image) {
        const imagePath = path.join(__dirname, '../uploads/ue', ue.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log('✅ Image supprimée:', ue.image);
        }
      }

      // 4. Supprimer l'UE elle-même
      await Ue.findByIdAndDelete(ue._id);
      console.log('✅ UE supprimée de la base de données');

      // Logger l'action
      await logAction({
        action: 'delete_ue',
        category: 'ue',
        userId: req.user ? req.user.userId : null,
        targetId: ue._id.toString(),
        details: { code: ue.code, intitule: ue.intitule }
      });

      res.json({
        success: true,
        message: 'UE supprimée avec succès'
      });

    } catch (deleteError) {
      console.error('❌ Erreur lors de la suppression:', deleteError);
      throw deleteError;
    }

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
    console.log(`🔍 Recherche participants pour UE: ${ueId}`);

    // ✅ ÉTAPE 1: D'abord récupérer l'UE pour connaître ses différents identifiants
    let ue = null;
    let ueIdForSearch = ueId;

    // Chercher l'UE pour récupérer tous ses identifiants possibles
    if (mongoose.Types.ObjectId.isValid(ueId)) {
      ue = await Ue.findById(ueId);
    }
    if (!ue) {
      ue = await Ue.findOne({ id: ueId });
    }
    if (!ue) {
      ue = await Ue.findOne({ code: ueId });
    }

    if (ue) {
      console.log(`✅ UE trouvée: ${ue.code} - ${ue.intitule}`);
      console.log(`📋 Identifiants UE disponibles:`, {
        _id: ue._id.toString(),
        id: ue.id,
        code: ue.code
      });
    }

    // ✅ ÉTAPE 2: Construire une liste de tous les IDs possibles à rechercher
    const possibleUeIds = [ueId]; // ID fourni en paramètre

    if (ue) {
      // Ajouter les autres identifiants de l'UE
      possibleUeIds.push(ue._id.toString());
      if (ue.id) possibleUeIds.push(ue.id);
      if (ue.code) possibleUeIds.push(ue.code);
    }

    // Retirer les doublons
    const uniqueUeIds = [...new Set(possibleUeIds)];
    console.log(`🔍 IDs à rechercher dans les relations:`, uniqueUeIds);

    // ✅ ÉTAPE 3: DEBUG - Afficher quelques relations pour comprendre la structure
    const allRelations = await UtilisateurUe.find({}).limit(10);
    console.log(`📋 Exemples de relations dans la BDD:`);
    allRelations.forEach((rel, index) => {
      console.log(`  Relation ${index}:`, {
        utilisateur_id: rel.utilisateur_id,
        ue_id: rel.ue_id,
        ue_id_type: typeof rel.ue_id
      });
    });

    // ✅ ÉTAPE 4: Rechercher les relations avec tous les IDs possibles
    let relations = [];

    for (const searchId of uniqueUeIds) {
      console.log(`🔍 Recherche relations avec ue_id: "${searchId}"`);

      // Recherche exacte (string)
      const foundRelations = await UtilisateurUe.find({ ue_id: searchId });
      console.log(`  → Trouvé ${foundRelations.length} relations`);

      relations.push(...foundRelations);

      // Si on a trouvé des relations, pas besoin de chercher plus
      if (foundRelations.length > 0) {
        console.log(`✅ Relations trouvées avec ue_id: "${searchId}"`);
        break;
      }
    }

    // Retirer les doublons au cas où
    const uniqueRelations = relations.filter((rel, index, self) =>
        index === self.findIndex(r => r.utilisateur_id === rel.utilisateur_id && r.ue_id === rel.ue_id)
    );

    console.log(`📊 Total relations uniques trouvées: ${uniqueRelations.length}`);

    if (uniqueRelations.length === 0) {
      console.log(`⚠️ Aucune relation trouvée pour l'UE`);
      return res.json({
        success: true,
        data: [],
        debug: {
          searchedUeId: ueId,
          possibleUeIds: uniqueUeIds,
          totalRelationsInDB: allRelations.length,
          availableUeIds: [...new Set(allRelations.map(r => r.ue_id))]
        }
      });
    }

    // ✅ ÉTAPE 5: Récupérer les utilisateurs correspondants
    const userIds = uniqueRelations.map(rel => rel.utilisateur_id);
    console.log(`👥 IDs utilisateurs à récupérer:`, userIds);

    const participants = [];

    for (const userId of userIds) {
      try {
        let utilisateur = null;

        // Recherche par champ "id" personnalisé d'abord
        utilisateur = await Utilisateur.findOne({ id: userId });

        // Si pas trouvé et que c'est un ObjectId valide, chercher par _id
        if (!utilisateur && mongoose.Types.ObjectId.isValid(userId)) {
          utilisateur = await Utilisateur.findById(userId);
        }

        // Si toujours pas trouvé, chercher par email
        if (!utilisateur) {
          utilisateur = await Utilisateur.findOne({ email: userId });
        }

        if (utilisateur) {
          // Récupérer les métadonnées de la relation
          const relation = uniqueRelations.find(rel => rel.utilisateur_id === userId);

          // Formater selon l'interface frontend
          const formattedParticipant = {
            id: utilisateur._id.toString(),
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            email: utilisateur.email,
            photo: utilisateur.photo,
            role: Array.isArray(utilisateur.role) ? utilisateur.role : [utilisateur.role],
            ues: [],
            // Métadonnées de la relation utilisateur_ue
            dateInscription: relation?.date_inscription || relation?.createdAt,
            statut: relation?.statut || 'actif',
            promotion: relation?.promotion,
            specialite: relation?.specialite,
            noteFinale: relation?.note_finale,
            presence: relation?.presence
          };

          participants.push(formattedParticipant);
          console.log(`✅ Participant ajouté: ${utilisateur.prenom} ${utilisateur.nom}`);
        } else {
          console.log(`⚠️ Utilisateur non trouvé pour ID: ${userId}`);
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la récupération du participant ${userId}:`, error.message);
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

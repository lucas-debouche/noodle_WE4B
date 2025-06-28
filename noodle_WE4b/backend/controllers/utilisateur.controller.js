const Utilisateur = require('../models/utilisateur.model');
const Ue = require('../models/ue.model');
const mongoose = require('mongoose');
const { logAction } = require('../utils/logActions');
const bcrypt = require('bcrypt'); // Ajout de bcrypt
const UeUserSyncService = require('../utils/syncUtils');

// GET /api/utilisateur → récupérer tous les utilisateurs
exports.getAllUtilisateurs = async (req, res) => {
  try {
    const utilisateurs = await Utilisateur.find();
    if (utilisateurs.length === 0) {
      await logAction({
        action: 'get_all_users_not_found',
        category: 'user',
        userId: req.params.userId,
        details: { success: false }
      });
      return res.status(404).json({ error: 'Aucun utilisateur trouvé.' });
    }
    await logAction({
      action: 'get_all_users',
      category: 'user',
      details: { count: utilisateurs.length }
    });
    res.json(utilisateurs);
  } catch (err) {
    await logAction({
      action: 'get_all_users_error',
      category: 'user',
      details: { error: error.message }
    });
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs.' });
  }
};

// GET /api/utilisateur/current → récupérer l'utilisateur courant
exports.getCurrentUtilisateur = async (req, res) => {
  console.log('/current : Début de la gestion de la requête');
  console.log(req.user);

  try {
    console.log('/current : Utilisateur ID extrait du token :', req.user.userId);

    const utilisateur = await Utilisateur.findById(new mongoose.Types.ObjectId(req.user.userId));
    if (!utilisateur) {
      console.log('/current : Aucun utilisateur trouvé avec cet ID');
      await logAction({
        action: 'get_current_user_not_found',
        category: 'user',
        userId: req.user.userId,
        details: { success: false }
      });
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    console.log('/current : Utilisateur trouvé, envoi de la réponse...');
    await logAction({
      action: 'get_current_user',
      category: 'user',
      userId: req.user.userId,
      details: { success: true }
    });
    res.status(200).json(utilisateur);
  } catch (err) {
    console.error('/current : Erreur lors de la récupération des données utilisateur :', err);
    await logAction({
      action: 'get_current_user_error',
      category: 'user',
      userId: req.user.userId,
      details: { error: err.message }
    });
    res.status(500).json({ error: 'Erreur lors de la récupération des données utilisateur.' });
  }
};

// GET /api/utilisateur/:userId → récupérer un utilisateur par son ID (pour le forum)
exports.getUtilisateurById = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findById(req.params.userId);
    if (!utilisateur) {
      await logAction({
        action: 'get_user_by_id_not_found',
        category: 'user',
        details: { targetUserId: req.params.userId }
      });
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    await logAction({
      action: 'get_user_by_id',
      category: 'user',
      details: { targetUserId: req.params.userId, success: true }
    });
    res.json(utilisateur);
  } catch (err) {
    await logAction({
      action: 'get_user_by_id_error',
      category: 'user',
      details: { targetUserId: req.params.userId, error: err.message }
    });
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Modifier un utilisateur
exports.updateUtilisateur = async (req, res) => {
  try {
    console.log('📝 Début mise à jour utilisateur:', req.params.userId);

    let roles = req.body.roles || req.body['roles[]'];
    roles = Array.isArray(roles) ? roles : (roles ? [roles] : []);

    let ues = req.body.ues || req.body['ues[]'];
    ues = Array.isArray(ues) ? ues : (ues ? [ues] : []);

    const { nom, prenom, email, plainPassword } = req.body;
    const photo = req.file ? req.file.filename : undefined;

    // Synchroniser les UEs si nécessaire
    if (ues !== undefined) {
      await UeUserSyncService.updateUserUes(req.params.userId, ues);
    }

    // Si des UEs sont modifiées, synchroniser chaque UE
    if (ues && Array.isArray(ues)) {
      const syncPromises = ues.map(ueId => UeUserSyncService.syncAllUsersForUe(ueId));
      await Promise.all(syncPromises);
      console.log('✅ Synchronisation effectuée pour toutes les UEs modifiées');
    }

    // Mettre à jour les autres champs
    const updateData = {
      ...(nom && { nom }),
      ...(prenom && { prenom }),
      ...(email && { email }),
      ...(roles.length > 0 && { role: roles }),
      ...(photo && { photo }),
      ...(plainPassword && { mot_passe: await bcrypt.hash(plainPassword, 10) })
    };

    const updatedUser = await Utilisateur.findByIdAndUpdate(
      req.params.userId,
      updateData,
      { new: true }
    ).populate('ues');

    res.json({
      success: true,
      message: 'Utilisateur modifié avec succès',
      utilisateur: updatedUser
    });

  } catch (err) {
    console.error("❌ Erreur mise à jour utilisateur:", err);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la modification de l'utilisateur",
      error: err.message
    });
  }
};

// Créer un utilisateur
exports.createUtilisateur = async (req, res) => {
  try {
    let roles = req.body.roles || req.body['roles[]'];
    if (!Array.isArray(roles)) {
      roles = roles ? [roles] : [];
    }

    let ues = req.body.ues || req.body['ues[]'];
    if (!Array.isArray(ues)) {
      ues = ues ? [ues] : [];
    }

    const photo = req.file ? req.file.filename : undefined;
    const { nom, prenom, email, plainPassword } = req.body;

    if (!nom || !prenom || !email || !plainPassword || roles.length === 0) {
      await logAction({
        action: 'create_user_missing_fields',
        category: 'user',
        userId: req.params.userId,
        details: { success: false }
      });
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    console.log('📝 Création utilisateur:', { nom, prenom, email, roles: roles.length, ues: ues.length });

    // 1. Créer l'utilisateur
    const utilisateur = new Utilisateur({
      nom,
      prenom,
      email,
      mot_passe: hashedPassword, // Utilisation du hash
      photo,
      role: roles,
      ues: ues // Stockage optionnel dans le modèle utilisateur
    });

    const savedUser = await utilisateur.save();
    console.log('✅ Utilisateur créé:', savedUser._id);

    // 2. Ajouter l'utilisateur aux UEs sélectionnées
    const uesProcessed = [];
    const uesErrors = [];

    if (ues && ues.length > 0) {
      console.log('👥 Attribution des UEs à l\'utilisateur:', ues);

      for (const ueId of ues) {
        try {
          let ue = null;

          // Rechercher l'UE par différents critères
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
            // Vérifier si l'utilisateur n'est pas déjà dans les participants
            const userObjectId = savedUser._id;
            if (!ue.participants) {
              ue.participants = [];
            }

            // Utiliser la méthode equals pour comparer les ObjectId
            const isAlreadyParticipant = ue.participants.some(id => id.equals && id.equals(userObjectId));

            if (!isAlreadyParticipant) {
              ue.participants.push(userObjectId);
              await ue.save();
              uesProcessed.push({
                id: ue._id,
                code: ue.code,
                intitule: ue.intitule
              });
              console.log(`✅ Utilisateur ajouté à l'UE: ${ue.code} - ${ue.intitule}`);
            } else {
              console.log(`⚠️ Utilisateur déjà présent dans l'UE: ${ue.code}`);
              uesProcessed.push({
                id: ue._id,
                code: ue.code,
                intitule: ue.intitule,
                note: 'Déjà inscrit'
              });
            }
          } else {
            console.log(`⚠️ UE non trouvée pour ID: ${ueId}`);
            uesErrors.push({
              ueId: ueId,
              error: 'UE non trouvée'
            });
          }
        } catch (ueError) {
          console.error(`❌ Erreur lors du traitement de l'UE ${ueId}:`, ueError.message);
          uesErrors.push({
            ueId: ueId,
            error: ueError.message
          });
        }
      }
    }

    // Si des UEs sont assignées, synchroniser chaque UE
    if (ues && Array.isArray(ues)) {
      const syncPromises = ues.map(ueId => UeUserSyncService.syncAllUsersForUe(ueId));
      await Promise.all(syncPromises);
      console.log('✅ Synchronisation effectuée pour toutes les UEs assignées');
    }

    await logAction({
      action: 'create_user',
      category: 'user',
      userId: req.user ? req.user.userId : null,
      targetId: savedUser._id.toString(), // Juste l'ID, pas l'objet complet
      details: {
        userEmail: savedUser.email,
        userName: `${savedUser.prenom} ${savedUser.nom}`,
        uesCount: uesProcessed.length,
        success: true
      }
    });

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      utilisateur: savedUser,
      uesAttribuees: uesProcessed.length,
      uesProcessed: uesProcessed,
      uesErrors: uesErrors.length > 0 ? uesErrors : undefined
    });

  } catch (err) {
    console.error("Erreur lors de la création de l'utilisateur :", err);

    // En cas d'erreur, essayer de nettoyer les données partielles
    if (err.name === 'ValidationError') {
      await logAction({
        action: 'create_user_error',
        category: 'user',
        userId: req.params.userId,
        details: { error: err.message }
      });
      return res.status(400).json({
        message: "Données invalides",
        errors: Object.keys(err.errors).map(key => ({
          field: key,
          message: err.errors[key].message
        }))
      });
    }

    await logAction({
      action: 'create_user_error',
      category: 'user',
      userId: req.params.userId,
      details: { error: err.message }
    });
    res.status(500).json({
      message: "Erreur lors de la création de l'utilisateur",
      error: err.message
    });
  }
};

// Méthode pour obtenir les participants d'une UE
exports.getParticipantsByUe = async (req, res) => {
  try {
    const ueId = req.params.ueId;
    console.log(`🔍 Recherche participants pour UE: ${ueId}`);

    // Récupérer l'UE avec populate des participants
    let ue;
    if (mongoose.Types.ObjectId.isValid(ueId)) {
      ue = await Ue.findById(ueId).populate('participants', 'nom prenom email photo role ues');
    }
    if (!ue) {
      ue = await Ue.findOne({ id: ueId }).populate('participants', 'nom prenom email photo role ues');
    }
    if (!ue) {
      ue = await Ue.findOne({ code: ueId }).populate('participants', 'nom prenom email photo role ues');
    }

    if (!ue) {
      return res.status(404).json({
        success: false,
        message: 'UE non trouvée'
      });
    }

    console.log(`✅ UE trouvée: ${ue.code} - ${ue.intitule}`);
    console.log(`👥 Participants: ${ue.participants ? ue.participants.length : 0}`);

    // Avec populate, les participants sont déjà des objets complets
    const formattedParticipants = ue.participants.map(participant => ({
      _id: participant._id.toString(),
      nom: participant.nom,
      prenom: participant.prenom,
      email: participant.email,
      photo: participant.photo,
      role: Array.isArray(participant.role) ? participant.role : [participant.role],
      ues: participant.ues || []
    }));

    await logAction({
      action: 'get_participants_by_ue',
      category: 'user',
      userId: req.params.userId,
      details: { data: formattedParticipants,
        ue: {
          id: ue._id.toString(),
          code: ue.code,
          intitule: ue.intitule,
          participantCount: ue.participants.length
        },
        success: true
      }
    });

    res.json({
      success: true,
      data: formattedParticipants,
      ue: {
        id: ue._id.toString(),
        code: ue.code,
        intitule: ue.intitule,
        participantCount: ue.participants.length
      }
    });

  } catch (err) {
    console.error('❌ Error in getParticipantsByUe:', err);
    await logAction({
      action: 'get_participants_by_ue_error',
      category: 'user',
      userId: req.params.userId,
      details: { error: err.message }
    })
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: err.message
    });
  }
};

// Méthode pour obtenir les UEs d'un utilisateur
exports.getUesByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`🔍 Recherche UEs pour utilisateur ID: ${userId}`);

    // Récupérer l'utilisateur avec populate des UEs
    let utilisateur;
    let ues;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      utilisateur = await Utilisateur.findById(userId).populate('ues');
      ues = await Ue.find({ _id: { $in: utilisateur.ues } });
      console.log(`�� UEs: ${ues.length}`);
    } else {
      return res.status(400).json({ message: 'ID utilisateur invalide' });
    }

    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    console.log(`✅ Utilisateur trouvé: ${utilisateur} ${utilisateur.nom} ${utilisateur.prenom}`);
    console.log(`📚 UEs associées: ${utilisateur.ues ? utilisateur.ues.length : 0}`);
    console.log(`�� UE: ${ues}`);

    // Formater les UEs
    const formattedUes = ues.map(ue => ({
      _id: ue._id.toString(),
      code: ue.code,
      intitule: ue.intitule,
      description: ue.description,
      participantsCount: ue.participants ? ue.participants.length : 0
    }));

    await logAction({
      action: 'get_ues_by_user',
      category: 'user',
      userId: userId,
      details: { data: formattedUes, success: true }
    });

    res.json({
      success: true,
      data: formattedUes,
      user: {
        id: utilisateur._id.toString(),
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email
      }
    });

  } catch (err) {
    console.error('�� Error in getUesByUserId:', err);
    await logAction({
      action: 'get_ues_by_user_error',
      category: 'user',
      userId: req.params.userId,
      details: { error: err.message }
    });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: err.message
    });
  }
};

exports.deleteUtilisateur = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('🗑️ Suppression utilisateur ID:', userId);

    // Utiliser le service de synchronisation pour supprimer proprement
    const result = await UeUserSyncService.deleteUserAndCleanUes(userId);

    await logAction({
      action: 'delete_user',
      category: 'user',
      userId: req.user ? req.user.userId : null,
      targetId: userId,
      details: {
        deletedUser: result.deletedUser,
        uesCount: result.uesCount,
        uesCleanedCount: result.cleanedUes.length,
        cleanedUes: result.cleanedUes,
        synchronized: true,
        success: true
      }
    });

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès et UEs mises à jour',
      details: {
        deletedUser: result.deletedUser,
        uesAffected: result.uesCount,
        uesUpdated: result.cleanedUes.length,
        cleanedUes: result.cleanedUes
      }
    });

  } catch (err) {
    console.error("Erreur lors de la suppression de l'utilisateur :", err);
    await logAction({
      action: 'delete_user_error',
      category: 'user',
      userId: req.user ? req.user.userId : null,
      targetId: req.params.userId,
      details: { error: err.message }
    });
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'utilisateur",
      error: err.message
    });
  }
};

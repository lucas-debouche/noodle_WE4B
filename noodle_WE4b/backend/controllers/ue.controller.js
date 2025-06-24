const mongoose = require('mongoose');
const Utilisateur = require('../models/utilisateur.model');
const Ue = require('../models/ue.model');
const UtilisateurUe = require('../models/utilisateur_ue.model'); // Nouveau modèle

// GET /api/ues → récupérer toutes les UEs
exports.getAllUes = async (req, res) => {
  try {
    const ues = await Ue.find();
    res.json(ues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/ues/:ueId → récupérer une UE par son ID
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

    // Formater selon l'interface frontend
    const formattedUe = {
      id: ue._id.toString(),
      code: ue.code,
      intitule: ue.intitule,
      image: ue.image,
      description: ue.description,
      ects: ue.ects
    };

    res.json(formattedUe);
  } catch (err) {
    console.error('Error in getUeById:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/ues/:ueId/participants → récupérer les participants d'une UE via la table de liaison
exports.getParticipantsByUe = async (req, res) => {
  try {
    const ueId = req.params.ueId;

    // DEBUG: Vérifier toutes les relations dans la collection
    const allRelations = await UtilisateurUe.find({});
    allRelations.slice(0, 5).forEach((rel, index) => {
    });

    // 1. Récupérer toutes les relations utilisateur_ue pour cette UE

    // Recherche exacte
    let relations = await UtilisateurUe.find({ ue_id: ueId });

    // Si pas trouvé, essayer comme string
    if (relations.length === 0) {
      relations = await UtilisateurUe.find({ ue_id: ueId.toString() });
    }

    // Si pas trouvé, essayer comme number
    if (relations.length === 0 && !isNaN(ueId)) {
      relations = await UtilisateurUe.find({ ue_id: parseInt(ueId) });
    }


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

// POST /api/ues/:ueId/participants → ajouter un participant à une UE via la table de liaison
exports.addParticipantToUe = async (req, res) => {
  try {
    const ueId = req.params.ueId;
    const { utilisateurId, promotion, specialite, statut } = req.body;


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

// DELETE /api/ues/:ueId/participants/:utilisateurId → retirer un participant d'une UE
exports.removeParticipantFromUe = async (req, res) => {
  try {
    const { ueId, utilisateurId } = req.params;


    // Supprimer la relation
    const result = await UtilisateurUe.deleteOne({
      utilisateur_id: utilisateurId,
      ue_id: ueId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Relation utilisateur-UE non trouvée' });
    }

    res.json({
      success: true,
      message: 'Participant retiré avec succès'
    });

  } catch (err) {
    console.error('Error in removeParticipantFromUe:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/ues/:ueId/participants/stats → statistiques des participants d'une UE
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

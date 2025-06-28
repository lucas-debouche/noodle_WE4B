// utils/syncUtils.js
const mongoose = require('mongoose');
const Ue = require('../models/ue.model');
const Utilisateur = require('../models/utilisateur.model');
const { logAction } = require('./logActions');

class UeUserSyncService {
  static async addUserToUe(userId, ueId) {
    try {
      console.log(`🔄 Ajout de l'utilisateur ${userId} à l'UE ${ueId}`);

      const [user, ue] = await Promise.all([
        Utilisateur.findById(userId),
        Ue.findById(ueId)
      ]);

      if (!user || !ue) {
        throw new Error('Utilisateur ou UE non trouvé');
      }

      // Mise à jour synchronisée
      const updates = [];

      // Ajouter l'UE à l'utilisateur s'il ne l'a pas déjà
      if (!user.ues.includes(ueId)) {
        user.ues.push(ueId);
        updates.push(user.save());
      }

      // Ajouter l'utilisateur à l'UE s'il n'y est pas déjà
      if (!ue.participants.includes(userId)) {
        ue.participants.push(userId);
        updates.push(ue.save());
      }

      await Promise.all(updates);
      console.log('✅ Synchronisation réussie');

      return {
        user: await Utilisateur.findById(userId).populate('ues'),
        ue: await Ue.findById(ueId).populate('participants')
      };

    } catch (error) {
      console.error('❌ Erreur synchronisation:', error);
      throw error;
    }
  }

  static async removeUserFromUe(userId, ueId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await Utilisateur.findById(userId).session(session);
      const ue = await Ue.findById(ueId).session(session);

      if (!user || !ue) {
        throw new Error('Utilisateur ou UE non trouvé');
      }

      // Retirer l'UE de l'utilisateur
      user.ues = user.ues.filter(id => id.toString() !== ueId.toString());
      await user.save({ session });

      // Retirer l'utilisateur de l'UE
      ue.participants = ue.participants.filter(id => id.toString() !== userId.toString());
      await ue.save({ session });

      await session.commitTransaction();

      return {
        user: await Utilisateur.findById(userId).populate('ues'),
        ue: await Ue.findById(ueId).populate('participants')
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async updateUserUes(userId, newUeIds) {
    try {
      const user = await Utilisateur.findById(userId);
      if (!user) throw new Error('Utilisateur non trouvé');

      const currentUes = user.ues.map(id => id.toString());
      const newUes = (Array.isArray(newUeIds) ? newUeIds : [])
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => id.toString());

      // Mettre à jour l'utilisateur
      user.ues = newUes.map(id => new mongoose.Types.ObjectId(id));
      await user.save();

      // Mettre à jour les UEs
      const updates = [];

      // Ajouter l'utilisateur aux nouvelles UEs
      for (const ueId of newUes) {
        if (!currentUes.includes(ueId)) {
          updates.push(
            Ue.findByIdAndUpdate(
              ueId,
              { $addToSet: { participants: userId } },
              { new: true }
            )
          );
        }
      }

      // Retirer l'utilisateur des anciennes UEs
      for (const ueId of currentUes) {
        if (!newUes.includes(ueId)) {
          updates.push(
            Ue.findByIdAndUpdate(
              ueId,
              { $pull: { participants: userId } },
              { new: true }
            )
          );
        }
      }

      await Promise.all(updates);

      const updatedUser = await Utilisateur.findById(userId)
        .populate('ues');

      return {
        user: updatedUser,
        uesToAdd: newUes.filter(id => !currentUes.includes(id)),
        uesToRemove: currentUes.filter(id => !newUes.includes(id)),
        updatedUes: updatedUser.ues
      };

    } catch (error) {
      console.error('❌ Erreur mise à jour:', error);
      throw error;
    }
  }

  static async syncUeParticipants(ueId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log(`🔄 Synchronisation forcée UE ${ueId}`);
      const ue = await Ue.findById(ueId).session(session);
      if (!ue) throw new Error('UE non trouvée');

      // Synchroniser les participants
      const participantsToUpdate = [];
      for (const participantId of ue.participants) {
        const user = await Utilisateur.findById(participantId).session(session);
        if (user && !user.ues.includes(ueId)) {
          user.ues.push(ueId);
          participantsToUpdate.push(user.save({ session }));
        }
      }

      // Synchroniser les utilisateurs qui ont cette UE
      const usersWithUe = await Utilisateur.find({ ues: ueId }).session(session);
      for (const user of usersWithUe) {
        if (!ue.participants.includes(user._id)) {
          ue.participants.push(user._id);
        }
      }

      await Promise.all([...participantsToUpdate, ue.save({ session })]);
      await session.commitTransaction();

      console.log('✅ Synchronisation terminée avec succès');
      return true;
    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Erreur synchronisation:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async deleteUeAndCleanUsers(ueId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const ue = await Ue.findById(ueId).session(session);
      if (!ue) throw new Error('UE non trouvée');

      // Nettoyer les références dans les utilisateurs
      const cleanupPromises = ue.participants.map(async participantId => {
        const user = await Utilisateur.findById(participantId).session(session);
        if (user) {
          user.ues = user.ues.filter(id => id.toString() !== ueId.toString());
          return user.save({ session });
        }
      });

      await Promise.all(cleanupPromises);
      await Ue.deleteOne({ _id: ueId }).session(session);

      await session.commitTransaction();
      console.log('✅ UE supprimée et utilisateurs nettoyés');

      return {
        success: true,
        deletedUe: ue,
        participantCount: ue.participants.length
      };
    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Erreur suppression:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Synchronise la liste des UEs pour chaque utilisateur en fonction des participants de l'UE.
   * Ajoute l'UE à chaque participant, la retire des utilisateurs qui ne sont plus participants.
   */
  static async syncAllUsersForUe(ueId) {
    try {
      console.log(`🔄 Début synchronisation pour UE ${ueId}`);

      const ue = await Ue.findById(ueId);
      if (!ue) {
        throw new Error('UE non trouvée');
      }

      const updates = [];
      let syncCount = 0;

      // 1. Synchroniser les participants existants
      console.log(`👥 Vérification de ${ue.participants.length} participants`);
      for (const participantId of ue.participants) {
        const user = await Utilisateur.findById(participantId);
        if (user) {
          const hasUe = user.ues.some(id => id.toString() === ueId.toString());
          if (!hasUe) {
            user.ues.push(ueId);
            updates.push(user.save());
            syncCount++;
            console.log(`➕ Ajout de l'UE ${ueId} à l'utilisateur ${participantId}`);
          }
        }
      }

      // 2. Nettoyer les références obsolètes
      console.log('🧹 Nettoyage des références obsolètes');
      const usersWithUe = await Utilisateur.find({ ues: ueId });
      for (const user of usersWithUe) {
        if (!ue.participants.includes(user._id)) {
          user.ues = user.ues.filter(id => id.toString() !== ueId.toString());
          updates.push(user.save());
          syncCount++;
          console.log(`➖ Retrait de l'UE ${ueId} de l'utilisateur ${user._id}`);
        }
      }

      // Exécuter toutes les mises à jour
      if (updates.length > 0) {
        await Promise.all(updates);
        console.log(`✅ ${updates.length} mises à jour effectuées`);
      } else {
        console.log('✅ Aucune mise à jour nécessaire');
      }

      // Logger le résultat
      await logAction({
        action: 'sync_ue_users',
        category: 'sync',
        targetId: ueId,
        details: {
          ueCode: ue.code,
          syncCount,
          participantsCount: ue.participants.length,
          success: true
        }
      });

      return {
        success: true,
        ueId: ue._id,
        syncCount,
        message: `Synchronisation terminée : ${syncCount} modifications`
      };

    } catch (error) {
      console.error('❌ Erreur de synchronisation:', error);
      await logAction({
        action: 'sync_ue_users_error',
        category: 'sync',
        targetId: ueId,
        details: { error: error.message }
      });
      throw error;
    }
  }
}

module.exports = UeUserSyncService;

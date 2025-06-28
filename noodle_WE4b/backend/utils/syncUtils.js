// utils/syncUtils.js
const Utilisateur = require('../models/utilisateur.model');
const Ue = require('../models/ue.model');
const mongoose = require('mongoose');

/**
 * Synchronise les relations UE-Utilisateur dans les deux sens
 */
class UeUserSyncService {

  /**
   * Ajoute un utilisateur à une UE et met à jour les deux tables
   */
  static async addUserToUe(userId, ueId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Trouver l'utilisateur et l'UE
      const user = await Utilisateur.findById(userId).session(session);
      const ue = await Ue.findById(ueId).session(session);

      if (!user || !ue) {
        throw new Error('Utilisateur ou UE non trouvé');
      }

      // 2. Mettre à jour l'UE (ajouter l'utilisateur aux participants)
      if (!ue.participants.includes(userId)) {
        ue.participants.push(userId);
        await ue.save({ session });
      }

      // 3. Mettre à jour l'utilisateur (ajouter l'UE à ses UEs)
      const ueIdString = ueId.toString();
      if (!user.ues.includes(ueIdString)) {
        user.ues.push(ueIdString);
        await user.save({ session });
      }

      await session.commitTransaction();
      return { success: true, user, ue };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Retire un utilisateur d'une UE et met à jour les deux tables
   */
  static async removeUserFromUe(userId, ueId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await Utilisateur.findById(userId).session(session);
      const ue = await Ue.findById(ueId).session(session);

      if (!user || !ue) {
        throw new Error('Utilisateur ou UE non trouvé');
      }

      // 1. Retirer de l'UE
      ue.participants = ue.participants.filter(id => !id.equals(userId));
      await ue.save({ session });

      // 2. Retirer de l'utilisateur
      const ueIdString = ueId.toString();
      user.ues = user.ues.filter(id => id !== ueIdString);
      await user.save({ session });

      await session.commitTransaction();
      return { success: true, user, ue };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Met à jour toutes les UEs d'un utilisateur
   */
  static async updateUserUes(userId, newUeIds) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await Utilisateur.findById(userId).session(session);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      const oldUeIds = user.ues || [];

      // UEs à retirer
      const uesToRemove = oldUeIds.filter(ueId => !newUeIds.includes(ueId));
      for (const ueId of uesToRemove) {
        const ue = await Ue.findById(ueId).session(session);
        if (ue) {
          ue.participants = ue.participants.filter(id => !id.equals(userId));
          await ue.save({ session });
        }
      }

      // UEs à ajouter
      const uesToAdd = newUeIds.filter(ueId => !oldUeIds.includes(ueId));
      for (const ueId of uesToAdd) {
        const ue = await Ue.findById(ueId).session(session);
        if (ue && !ue.participants.includes(userId)) {
          ue.participants.push(userId);
          await ue.save({ session });
        }
      }

      // Mettre à jour l'utilisateur
      user.ues = newUeIds;
      await user.save({ session });

      await session.commitTransaction();
      return { success: true, user, uesToRemove, uesToAdd };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Supprime un utilisateur et le retire de toutes les UEs
   */
  static async deleteUserAndCleanUes(userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Récupérer l'utilisateur à supprimer
      const user = await Utilisateur.findById(userId).session(session);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      const userUes = [...user.ues]; // Copie pour éviter les modifications en cours

      // 2. Retirer l'utilisateur de toutes les UEs où il participe
      const uesWithThisUser = await Ue.find({
        participants: userId
      }).session(session);

      const cleanedUes = [];
      for (const ue of uesWithThisUser) {
        ue.participants = ue.participants.filter(id => !id.equals(userId));
        await ue.save({ session });
        cleanedUes.push({
          ueId: ue._id,
          code: ue.code,
          intitule: ue.intitule
        });
      }

      // 3. Supprimer l'utilisateur
      await Utilisateur.findByIdAndDelete(userId).session(session);

      await session.commitTransaction();

      return {
        success: true,
        deletedUser: {
          id: user._id,
          email: user.email,
          name: `${user.prenom} ${user.nom}`
        },
        uesCount: userUes.length,
        cleanedUes: cleanedUes
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Supprime une UE et la retire de tous les utilisateurs
   */
  static async deleteUeAndCleanUsers(ueId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Récupérer l'UE à supprimer
      const ue = await Ue.findById(ueId).session(session);
      if (!ue) {
        throw new Error('UE non trouvée');
      }

      const ueIdString = ueId.toString();
      const participantIds = [...ue.participants]; // Copie pour éviter les modifications en cours

      // 2. Retirer l'UE de tous les utilisateurs qui l'ont
      const usersWithThisUe = await Utilisateur.find({
        ues: ueIdString
      }).session(session);

      const cleanedUsers = [];
      for (const user of usersWithThisUe) {
        user.ues = user.ues.filter(id => id !== ueIdString);
        await user.save({ session });
        cleanedUsers.push({
          userId: user._id,
          email: user.email,
          name: `${user.prenom} ${user.nom}`
        });
      }

      // 3. Supprimer l'UE
      await Ue.findByIdAndDelete(ueId).session(session);

      await session.commitTransaction();

      return {
        success: true,
        deletedUe: {
          id: ue._id,
          code: ue.code,
          intitule: ue.intitule
        },
        participantCount: participantIds.length,
        cleanedUsers: cleanedUsers
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Vérifie et répare les incohérences entre UE et Utilisateur
   */
  static async auditAndRepair() {
    const inconsistencies = [];

    try {
      // 1. Vérifier toutes les UEs
      const ues = await Ue.find({});
      for (const ue of ues) {
        for (const participantId of ue.participants) {
          const user = await Utilisateur.findById(participantId);
          if (user) {
            const ueIdString = ue._id.toString();
            if (!user.ues.includes(ueIdString)) {
              // Incohérence : UE a l'utilisateur mais utilisateur n'a pas l'UE
              user.ues.push(ueIdString);
              await user.save();
              inconsistencies.push({
                type: 'user_missing_ue',
                userId: user._id,
                ueId: ue._id,
                fixed: true
              });
            }
          } else {
            // Utilisateur supprimé mais toujours dans l'UE
            ue.participants = ue.participants.filter(id => !id.equals(participantId));
            await ue.save();
            inconsistencies.push({
              type: 'orphan_participant',
              userId: participantId,
              ueId: ue._id,
              fixed: true
            });
          }
        }
      }

      // 2. Vérifier tous les utilisateurs
      const users = await Utilisateur.find({});
      for (const user of users) {
        for (const ueIdString of user.ues) {
          const ue = await Ue.findById(ueIdString);
          if (ue) {
            if (!ue.participants.includes(user._id)) {
              // Incohérence : Utilisateur a l'UE mais UE n'a pas l'utilisateur
              ue.participants.push(user._id);
              await ue.save();
              inconsistencies.push({
                type: 'ue_missing_participant',
                userId: user._id,
                ueId: ue._id,
                fixed: true
              });
            }
          } else {
            // UE supprimée mais toujours chez l'utilisateur
            user.ues = user.ues.filter(id => id !== ueIdString);
            await user.save();
            inconsistencies.push({
              type: 'orphan_ue',
              userId: user._id,
              ueId: ueIdString,
              fixed: true
            });
          }
        }
      }

      return {
        success: true,
        inconsistencies: inconsistencies.length,
        details: inconsistencies
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        inconsistencies: inconsistencies.length,
        details: inconsistencies
      };
    }
  }
}

module.exports = UeUserSyncService;

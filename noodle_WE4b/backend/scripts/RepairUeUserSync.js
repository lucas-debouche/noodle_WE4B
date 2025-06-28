// scripts/repairUeUserSync.js
// Script à exécuter une fois pour réparer les données existantes

require('dotenv').config();
const mongoose = require('mongoose');
const Utilisateur = require('../models/utilisateur.model');
const Ue = require('../models/ue.model');

async function repairUeUserData() {
  try {
    console.log('🔧 Début de la réparation des données UE-Utilisateur...');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/noodle');
    console.log('✅ Connecté à MongoDB');

    const stats = {
      uesChecked: 0,
      usersChecked: 0,
      inconsistenciesFound: 0,
      orphansRemoved: 0,
      relationshipsAdded: 0
    };

    // 1. Nettoyer les participants orphelins dans les UEs
    console.log('\n1. 🧹 Nettoyage des participants orphelins...');
    const ues = await Ue.find({});

    for (const ue of ues) {
      stats.uesChecked++;
      const validParticipants = [];

      for (const participantId of ue.participants) {
        const user = await Utilisateur.findById(participantId);
        if (user) {
          validParticipants.push(participantId);

          // Vérifier si l'utilisateur a cette UE dans sa liste
          const ueIdString = ue._id.toString();
          if (!user.ues.includes(ueIdString)) {
            console.log(`  ➕ Ajout UE ${ue.code} à l'utilisateur ${user.email}`);
            user.ues.push(ueIdString);
            await user.save();
            stats.relationshipsAdded++;
          }
        } else {
          console.log(`  🗑️ Participant orphelin supprimé de l'UE ${ue.code}: ${participantId}`);
          stats.orphansRemoved++;
        }
      }

      // Mettre à jour l'UE si nécessaire
      if (validParticipants.length !== ue.participants.length) {
        ue.participants = validParticipants;
        await ue.save();
      }
    }

    // 2. Nettoyer les UEs orphelines chez les utilisateurs
    console.log('\n2. 🧹 Nettoyage des UEs orphelines...');
    const users = await Utilisateur.find({});

    for (const user of users) {
      stats.usersChecked++;
      const validUes = [];

      for (const ueIdString of user.ues) {
        const ue = await Ue.findById(ueIdString);
        if (ue) {
          validUes.push(ueIdString);

          // Vérifier si l'UE a cet utilisateur dans ses participants
          if (!ue.participants.includes(user._id)) {
            console.log(`  ➕ Ajout utilisateur ${user.email} à l'UE ${ue.code}`);
            ue.participants.push(user._id);
            await ue.save();
            stats.relationshipsAdded++;
          }
        } else {
          console.log(`  🗑️ UE orpheline supprimée de l'utilisateur ${user.email}: ${ueIdString}`);
          stats.orphansRemoved++;
        }
      }

      // Mettre à jour l'utilisateur si nécessaire
      if (validUes.length !== user.ues.length) {
        user.ues = validUes;
        await user.save();
      }
    }

    // 3. Vérification spéciale : UEs supprimées mais toujours référencées
    console.log('\n3. 🔍 Vérification des UEs supprimées mais toujours référencées...');
    const allUsers = await Utilisateur.find({});

    for (const user of allUsers) {
      const cleanedUes = [];

      for (const ueIdString of user.ues) {
        const ueExists = await Ue.findById(ueIdString);
        if (ueExists) {
          cleanedUes.push(ueIdString);
        } else {
          console.log(`  🗑️ UE supprimée retirée de l'utilisateur ${user.email}: ${ueIdString}`);
          stats.orphansRemoved++;
        }
      }

      // Mettre à jour si nécessaire
      if (cleanedUes.length !== user.ues.length) {
        user.ues = cleanedUes;
        await user.save();
        console.log(`  ✅ Utilisateur ${user.email} mis à jour (${user.ues.length - cleanedUes.length} UEs supprimées)`);
      }
    }

    // 4. Rapport final
    console.log('\n📊 RAPPORT DE RÉPARATION:');
    console.log(`   UEs vérifiées: ${stats.uesChecked}`);
    console.log(`   Utilisateurs vérifiés: ${stats.usersChecked}`);
    console.log(`   Incohérences trouvées: ${stats.inconsistenciesFound}`);
    console.log(`   Orphelins supprimés: ${stats.orphansRemoved}`);
    console.log(`   Relations ajoutées: ${stats.relationshipsAdded}`);

    if (stats.orphansRemoved === 0 && stats.relationshipsAdded === 0) {
      console.log('✅ Aucune incohérence trouvée. Les données sont cohérentes!');
    } else {
      console.log('✅ Réparation terminée avec succès!');
    }

    return stats;

  } catch (error) {
    console.error('❌ Erreur lors de la réparation:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('📊 Connexion MongoDB fermée');
  }
}

// Exécution du script si appelé directement
if (require.main === module) {
  repairUeUserData()
    .then(stats => {
      console.log('\n🎉 Script terminé avec succès!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = repairUeUserData;

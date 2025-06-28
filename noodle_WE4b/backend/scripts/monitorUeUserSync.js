// scripts/monitorUeUserSync.js
// Script de surveillance pour détecter les incohérences

require('dotenv').config();
const mongoose = require('mongoose');
const Utilisateur = require('../models/utilisateur.model');
const Ue = require('../models/ue.model');

class UeUserMonitor {

  /**
   * Effectue une vérification complète sans réparation
   */
  static async checkConsistency() {
    try {
      console.log('🔍 Vérification de la cohérence UE-Utilisateur...');

      const issues = {
        orphanParticipants: [],
        orphanUes: [],
        missingFromUe: [],
        missingFromUser: [],
        summary: {
          totalIssues: 0,
          criticalIssues: 0
        }
      };

      // 1. Vérifier les participants orphelins dans les UEs
      const ues = await Ue.find({});
      for (const ue of ues) {
        for (const participantId of ue.participants) {
          const user = await Utilisateur.findById(participantId);
          if (!user) {
            issues.orphanParticipants.push({
              ueId: ue._id,
              ueCode: ue.code,
              orphanUserId: participantId
            });
          } else {
            // Vérifier si l'utilisateur a cette UE
            const ueIdString = ue._id.toString();
            if (!user.ues.includes(ueIdString)) {
              issues.missingFromUser.push({
                ueId: ue._id,
                ueCode: ue.code,
                userId: user._id,
                userEmail: user.email
              });
            }
          }
        }
      }

      // 2. Vérifier les UEs orphelines chez les utilisateurs
      const users = await Utilisateur.find({});
      for (const user of users) {
        for (const ueIdString of user.ues) {
          const ue = await Ue.findById(ueIdString);
          if (!ue) {
            issues.orphanUes.push({
              userId: user._id,
              userEmail: user.email,
              orphanUeId: ueIdString
            });
          } else {
            // Vérifier si l'UE a cet utilisateur
            if (!ue.participants.includes(user._id)) {
              issues.missingFromUe.push({
                userId: user._id,
                userEmail: user.email,
                ueId: ue._id,
                ueCode: ue.code
              });
            }
          }
        }
      }

      // 3. Calculer les statistiques
      issues.summary.totalIssues =
        issues.orphanParticipants.length +
        issues.orphanUes.length +
        issues.missingFromUe.length +
        issues.missingFromUser.length;

      issues.summary.criticalIssues =
        issues.orphanParticipants.length +
        issues.orphanUes.length;

      return issues;

    } catch (error) {
      console.error('❌ Erreur lors de la vérification:', error);
      throw error;
    }
  }

  /**
   * Génère un rapport détaillé
   */
  static async generateReport() {
    try {
      await mongoose.connect('mongodb://localhost:27017/noodle');

      const issues = await this.checkConsistency();
      const stats = await this.getGeneralStats();

      console.log('\n📊 RAPPORT DE COHÉRENCE UE-UTILISATEUR');
      console.log('=====================================');

      console.log('\n📈 STATISTIQUES GÉNÉRALES:');
      console.log(`   Nombre total d'UEs: ${stats.totalUes}`);
      console.log(`   Nombre total d'utilisateurs: ${stats.totalUsers}`);
      console.log(`   Relations UE-Utilisateur: ${stats.totalRelations}`);

      console.log('\n🔍 ISSUES DÉTECTÉES:');
      console.log(`   Total des problèmes: ${issues.summary.totalIssues}`);
      console.log(`   Problèmes critiques: ${issues.summary.criticalIssues}`);

      if (issues.orphanParticipants.length > 0) {
        console.log(`\n❌ PARTICIPANTS ORPHELINS (${issues.orphanParticipants.length}):`);
        issues.orphanParticipants.forEach(issue => {
          console.log(`   • UE ${issue.ueCode} a un participant inexistant: ${issue.orphanUserId}`);
        });
      }

      if (issues.orphanUes.length > 0) {
        console.log(`\n❌ UES ORPHELINES (${issues.orphanUes.length}):`);
        issues.orphanUes.forEach(issue => {
          console.log(`   • Utilisateur ${issue.userEmail} a une UE inexistante: ${issue.orphanUeId}`);
        });
      }

      if (issues.missingFromUser.length > 0) {
        console.log(`\n⚠️ MANQUANT CÔTÉ UTILISATEUR (${issues.missingFromUser.length}):`);
        issues.missingFromUser.forEach(issue => {
          console.log(`   • UE ${issue.ueCode} a ${issue.userEmail} mais l'utilisateur n'a pas l'UE`);
        });
      }

      if (issues.missingFromUe.length > 0) {
        console.log(`\n⚠️ MANQUANT CÔTÉ UE (${issues.missingFromUe.length}):`);
        issues.missingFromUe.forEach(issue => {
          console.log(`   • Utilisateur ${issue.userEmail} a l'UE ${issue.ueCode} mais l'UE n'a pas l'utilisateur`);
        });
      }

      if (issues.summary.totalIssues === 0) {
        console.log('\n✅ EXCELLENT! Aucune incohérence détectée.');
      } else {
        console.log('\n🔧 RECOMMANDATION: Exécutez le script de réparation pour corriger ces problèmes.');
        console.log('   Command: node scripts/repairUeUserSync.js');
      }

      return {
        issues,
        stats,
        isConsistent: issues.summary.totalIssues === 0
      };

    } catch (error) {
      console.error('❌ Erreur lors de la génération du rapport:', error);
      throw error;
    } finally {
      await mongoose.connection.close();
    }
  }

  /**
   * Récupère les statistiques générales
   */
  static async getGeneralStats() {
    const ues = await Ue.find({});
    const users = await Utilisateur.find({});

    let totalRelations = 0;
    ues.forEach(ue => {
      totalRelations += ue.participants.length;
    });

    return {
      totalUes: ues.length,
      totalUsers: users.length,
      totalRelations: totalRelations
    };
  }

  /**
   * Mode surveillance continue (pour cron job)
   */
  static async watchMode() {
    try {
      await mongoose.connect('mongodb://localhost:27017/noodle');

      const issues = await this.checkConsistency();
      const timestamp = new Date().toISOString();

      if (issues.summary.totalIssues > 0) {
        console.log(`[${timestamp}] ⚠️ ${issues.summary.totalIssues} incohérences détectées!`);

        // Ici vous pourriez envoyer une alerte (email, Slack, etc.)
        // await sendAlert(issues);

        return {
          status: 'INCONSISTENT',
          issues: issues.summary.totalIssues,
          critical: issues.summary.criticalIssues
        };
      } else {
        console.log(`[${timestamp}] ✅ Données cohérentes`);
        return {
          status: 'CONSISTENT',
          issues: 0,
          critical: 0
        };
      }

    } catch (error) {
      console.error(`❌ Erreur en mode surveillance:`, error);
      return {
        status: 'ERROR',
        error: error.message
      };
    } finally {
      await mongoose.connection.close();
    }
  }
}

// Exécution selon les arguments
if (require.main === module) {
  const mode = process.argv[2] || 'report';

  switch (mode) {
    case 'report':
      UeUserMonitor.generateReport()
        .then(result => {
          process.exit(result.isConsistent ? 0 : 1);
        })
        .catch(error => {
          console.error('💥 Erreur fatale:', error);
          process.exit(2);
        });
      break;

    case 'watch':
      UeUserMonitor.watchMode()
        .then(result => {
          process.exit(result.status === 'CONSISTENT' ? 0 : 1);
        })
        .catch(error => {
          console.error('💥 Erreur fatale:', error);
          process.exit(2);
        });
      break;

    default:
      console.log('Usage: node monitorUeUserSync.js [report|watch]');
      process.exit(1);
  }
}

module.exports = UeUserMonitor;

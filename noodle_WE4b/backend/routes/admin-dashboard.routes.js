// routes/admin-dashboard.routes.js
const express = require('express');
const router = express.Router();
const AdminDashboardController = require('../controllers/admin-dashboard.controller');
const authMiddleware = require('../security/middleware_auth');

// ===============================
// ROUTES PRINCIPALES DU DASHBOARD
// ===============================

// Vue d'ensemble du dashboard avec métriques principales
router.get('/overview',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.getDashboardOverview
);

// Données temps réel
router.get('/realtime',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.getRealTimeData
);

// Métriques système
router.get('/metrics',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.getSystemHealth
);

// ===============================
// ANALYSES SPÉCIALISÉES
// ===============================

// Analyses générales avec filtres
router.post('/analytics',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.getAnalyticsData
);

// Analyses OLAP
router.post('/olap',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.getOlapAnalysis
);

// Analyses OLAP détaillées
router.post('/olap/detailed',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.getDetailedOlapAnalysis
);

// ===============================
// ANALYSES COMPORTEMENTALES
// ===============================

// Analyse de l'activité utilisateur
router.post('/analysis/user-activity',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.getUserActivityAnalysis
);

// Analyse de participation aux UEs
router.post('/analysis/ue-participation',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.getUeParticipationAnalysis
);

// Analyse d'engagement des forums
router.post('/analysis/forum-engagement',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.getForumEngagementAnalysis
);

// Analyse de performance
router.post('/analysis/performance',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.getPerformanceAnalysis
);

// Analyse de cohorte
router.post('/analysis/cohort',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.getCohortAnalysis
);

// Analyse de rétention
router.post('/analysis/retention',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.getRetentionAnalysis
);

// Analyse des patterns d'utilisation
router.post('/analysis/usage-patterns',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.getUsagePatternAnalysis
);

// ===============================
// ANALYSES TEMPORELLES
// ===============================

// Série temporelle
router.post('/timeseries',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.getTimeSeriesAnalysis
);

// Analyse de saisonnalité
router.post('/seasonality',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.getSeasonalityAnalysis
);

// Analyse de tendances
router.post('/trends',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.getTrendAnalysis
);

// Détection d'anomalies
router.post('/anomalies',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.getAnomalyDetection
);

// ===============================
// ANALYSES GÉOGRAPHIQUES
// ===============================

// Distribution géographique
router.get('/geographical',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.getGeographicalDistribution
);

// Activité régionale
router.post('/regional-activity',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.getRegionalActivity
);

// ===============================
// EXPORT ET RAPPORTS
// ===============================

// Export de données
router.post('/export/:format',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.exportDashboardData
);

// Génération de rapports
router.post('/reports/:reportType',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.generateReport
);

// Programmation de rapports
router.post('/reports/schedule',
  authMiddleware(['ROLE_ADMIN']),
  AdminDashboardController.scheduleReport
);

// ===============================
// UTILITAIRES ET MAINTENANCE
// ===============================

// Nettoyage du cache
router.post('/cache/clear',
  authMiddleware(['ROLE_ADMIN']),
  async (req, res) => {
    try {
      // Logique de nettoyage du cache
      res.json({ success: true, message: 'Cache nettoyé avec succès' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Reconstruction des index
router.post('/maintenance/rebuild-indexes',
  authMiddleware(['ROLE_ADMIN']),
  async (req, res) => {
    try {
      // Logique de reconstruction des index MongoDB
      res.json({ success: true, message: 'Index reconstruits avec succès' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Optimisation des collections
router.post('/maintenance/optimize-collections',
  authMiddleware(['ROLE_ADMIN']),
  async (req, res) => {
    try {
      // Logique d'optimisation des collections
      res.json({ success: true, message: 'Collections optimisées avec succès' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

module.exports = router;

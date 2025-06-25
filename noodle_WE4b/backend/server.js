require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Middlewares et routes
const authMiddleware = require('./security/middleware_auth');

const authRoutes = require('./routes/auth.routes');
const utilisateurRoutes = require('./routes/utilisateur.routes');
const postRoutes = require('./routes/post.routes');
const prioriteRoutes = require('./routes/priorite.routes');
const typeRoutes = require('./routes/type.routes');
const forumsRoutes = require('./routes/forums.routes');
const roleRoutes = require('./routes/roles.routes');
const departementRoutes = require('./routes/departement.routes');
const ueRoutes = require('./routes/ue.routes');
const adminPanelRoutes = require('./routes/admin_panel.routes');

const app = express();
const PORT = 3000;

// ==========================================
// CONFIGURATION DE BASE
// ==========================================

// Créer les dossiers d'upload s'ils n'existent pas
const createUploadDirs = () => {
  const dirs = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads/forums'),
    path.join(__dirname, 'uploads/user'),
    path.join(__dirname, 'uploads/ue')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Dossier créé: ${dir}`);
    }
  });
};
createUploadDirs();

// Middleware
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true,
  exposedHeaders: ['x-refresh-token']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// CONNEXION À MONGODB
// ==========================================
mongoose.connect('mongodb://localhost:27017/noodle')
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

// ==========================================
// ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/utilisateur', utilisateurRoutes);
app.use('/api/post', postRoutes);
app.use('/api/priorite', prioriteRoutes);
app.use('/api/type', typeRoutes);
app.use('/api/forums', forumsRoutes);
app.use('/api/role', roleRoutes);
app.use('/api/ue', ueRoutes);
app.use('/api/admin', adminPanelRoutes);
app.use('/api/departements', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), departementRoutes);

// ==========================================
// FICHIERS STATIQUES
// ==========================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// GESTION DES ERREURS
// ==========================================
app.use((error, req, res, next) => {
  console.error('❌ Erreur serveur:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: error.errors
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID invalide'
    });
  }

  if (error.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur lors de l\'upload de fichier'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
});

// Middleware catch-all pour routes inconnues
app.use('/api', (req, res) => {
  console.log('❌ Route API non trouvée:', req.method, req.path);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} non trouvée`
  });
});

// ==========================================
// DÉMARRAGE DU SERVEUR
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log('📍 Routes configurées:');
  console.log('  /api/auth - Authentification');
  console.log('  /api/utilisateur - Utilisateurs');
  console.log('  /api/post - Posts');
  console.log('  /api/priorite - Priorités');
  console.log('  /api/type - Types');
  console.log('  /api/forums - Forums');
  console.log('  /api/role - Rôles');
  console.log('  /api/ue - Unités d\'enseignement');
  console.log('  /api/departements - Départements (protégé)');
  console.log('  /api/admin - Panel admin');
});

// ==========================================
// FERMETURE PROPRE
// ==========================================
process.on('SIGINT', () => {
  console.log('\n👋 Arrêt du serveur...');
  mongoose.connection.close(() => {
    console.log('📊 Connexion MongoDB fermée');
    process.exit(0);
  });
});

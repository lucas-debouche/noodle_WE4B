require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

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

// Initialiser les dossiers
createUploadDirs();

// Middleware de base
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true,
  exposedHeaders: ['x-refresh-token']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connexion MongoDB
mongoose.connect('mongodb://localhost:27017/noodle')
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

// ==========================================
// ROUTES
// ==========================================

// Routes d'authentification (PUBLIC)
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// Routes utilisateurs
const utilisateurRoutes = require('./routes/utilisateur.routes');
app.use('/api/utilisateur', utilisateurRoutes);

// Routes posts
const postRoutes = require('./routes/post.routes');
app.use('/api/post', postRoutes);

// Routes départements (protégées)
const authMiddleware = require('./security/middleware_auth');
const departementRoutes = require('./routes/departement.routes');
app.use('/api/departements', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), departementRoutes);

// Routes forums
const forumsRoutes = require('./routes/forums.routes');
app.use('/api/forums', forumsRoutes);

// Routes UE
const ueRoutes = require('./routes/ue.routes');
app.use('/api/ue', ueRoutes);

// ==========================================
// FICHIERS STATIQUES
// ==========================================

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// GESTION DES ERREURS
// ==========================================

// Middleware de gestion d'erreur global
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

// ✅ CORRECTION: Route 404 pour les APIs (pattern corrigé)
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
  console.log('  /api/departements - Départements (protégé)');
  console.log('  /api/forums - Forums');
  console.log('  /api/ue - Unités d\'enseignement');
});

// Gestion propre de l'arrêt du serveur
process.on('SIGINT', () => {
  console.log('\n👋 Arrêt du serveur...');
  mongoose.connection.close(() => {
    console.log('📊 Connexion MongoDB fermée');
    process.exit(0);
  });
});

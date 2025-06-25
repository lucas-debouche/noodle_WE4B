require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

console.log('🚀 Test progressif des éléments...');

// ==========================================
// ÉTAPE 1: Configuration de base étendue
// ==========================================

console.log('ÉTAPE 1: Ajout des middlewares de base...');

app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true,
  exposedHeaders: ['x-refresh-token']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

console.log('✅ Middlewares de base ajoutés');

// ==========================================
// ÉTAPE 2: Connexion MongoDB
// ==========================================

console.log('ÉTAPE 2: Connexion MongoDB...');

mongoose.connect('mongodb://localhost:27017/noodle')
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

// ==========================================
// ÉTAPE 3: Création des dossiers
// ==========================================

console.log('ÉTAPE 3: Création des dossiers upload...');

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
    }
  });
};

createUploadDirs();
console.log('✅ Dossiers créés');

// ==========================================
// ÉTAPE 4: Ajout des routes (comme dans minimal)
// ==========================================

console.log('ÉTAPE 4: Ajout des routes...');

const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

const utilisateurRoutes = require('./routes/utilisateur.routes');
app.use('/api/utilisateur', utilisateurRoutes);

const postRoutes = require('./routes/post.routes');
app.use('/api/post', postRoutes);

const departementRoutes = require('./routes/departement.routes');
const authMiddleware = require('./security/middleware_auth');
app.use('/api/departements', authMiddleware(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']), departementRoutes);

const forumsRoutes = require('./routes/forums.routes');
app.use('/api/forums', forumsRoutes);

const ueRoutes = require('./routes/ue.routes');
app.use('/api/ue', ueRoutes);

console.log('✅ Routes ajoutées');

// ==========================================
// ÉTAPE 5: POINT CRITIQUE - Fichiers statiques
// ==========================================

console.log('ÉTAPE 5: Test ajout fichiers statiques...');

try {
  // Test avec UNE SEULE ligne de fichiers statiques
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  console.log('✅ Fichiers statiques ajoutés avec succès');
} catch (error) {
  console.error('❌ ERREUR lors de l\'ajout des fichiers statiques:', error.message);
  process.exit(1);
}

// ==========================================
// ÉTAPE 6: Middleware de gestion d'erreur
// ==========================================

console.log('ÉTAPE 6: Test ajout middleware d\'erreur...');

try {
  app.use((error, req, res, next) => {
    console.error('Erreur serveur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  });
  console.log('✅ Middleware d\'erreur ajouté');
} catch (error) {
  console.error('❌ ERREUR lors de l\'ajout du middleware d\'erreur:', error.message);
  process.exit(1);
}

// ==========================================
// ÉTAPE 7: Route 404
// ==========================================

console.log('ÉTAPE 7: Test ajout route 404...');

try {
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.method} ${req.path} non trouvée`
    });
  });
  console.log('✅ Route 404 ajoutée');
} catch (error) {
  console.error('❌ ERREUR lors de l\'ajout de la route 404:', error.message);
  process.exit(1);
}

// ==========================================
// ÉTAPE 8: Démarrage du serveur
// ==========================================

console.log('ÉTAPE 8: Démarrage du serveur...');

app.listen(PORT, () => {
  console.log(`🎉 SUCCÈS! Serveur démarré sur http://localhost:${PORT}`);
  console.log('📍 Tous les éléments ont été ajoutés avec succès');
}).on('error', (error) => {
  console.error('❌ ERREUR lors du démarrage du serveur:', error);
});

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const utilisateurRoutes = require('./routes/utilisateur.routes');
const ueRoutes = require('./routes/ue.routes');
const postRoutes = require('./routes/post.routes');
const authRoutes = require('./routes/auth.routes');
const forumsRoutes = require('./routes/forums.routes');

const path = require('path');
const fs = require('fs');
const adminPanelRoutes = require('./routes/admin_panel.routes');


const app = express();
const PORT = 3000;

// Créer les dossiers d'upload s'ils n'existent pas
const createUploadDirs = () => {
  const dirs = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads/forums'),
    path.join(__dirname, 'uploads/user')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Dossier créé: ${dir}`);
    }
  });
};

// Initialiser les dossiers
createUploadDirs();

// Middleware
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/noodle')
  .then(() => console.log('Connecté à MongoDB'))
  .catch(err => console.error(err));

// Routes
app.use('/api/utilisateur', utilisateurRoutes);
app.use('/api/ue', ueRoutes);
app.use('/api/post', postRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/forums', forumsRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/admin', adminPanelRoutes);


// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route spécifique pour les fichiers de forum (pour la sécurité)
app.use('/uploads/forums', express.static(path.join(__dirname, 'uploads/forums')));

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

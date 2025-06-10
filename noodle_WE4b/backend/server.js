require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const utilisateurRoutes = require('./routes/utilisateur.routes');
const ueRoutes = require('./routes/ue.routes');
const postRoutes = require('./routes/post.routes');
const authRoutes = require('./routes/auth.routes');
const path = require('path');


const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/noodle')
  .then(() => console.log('Connecté à MongoDB'))
  .catch(err => console.error(err));

app.use('/api/utilisateur', utilisateurRoutes);
app.use('/api/ue', ueRoutes);
app.use('/api/post', postRoutes);
app.use("/api/auth", authRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const utilisateurRoutes = require('./routes/utilisateur.routes');
const ueRoutes = require('./routes/ue.routes');
const postRoutes = require('./routes/post.routes');

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

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    // Vérification du mot de passe chiffré (ex: bcrypt)
    const match = await bcrypt.compare(password, user.mot_passe);
    if (!match) return res.status(401).json({ error: 'Mot de passe incorrect' });

    res.json(user); // ou générer un token
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

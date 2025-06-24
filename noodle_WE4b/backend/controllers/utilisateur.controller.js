const Utilisateur = require('../models/utilisateur.model');
const mongoose = require('mongoose');

// GET /api/utilisateur → récupérer tous les utilisateurs
exports.getAllUtilisateurs = async (req, res) => {
  try {
    const utilisateurs = await Utilisateur.find();
    if (utilisateurs.length === 0) {
      return res.status(404).json({ error: 'Aucun utilisateur trouvé.' });
    }
    res.json(utilisateurs);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs.' });
  }
};

// GET /api/utilisateur/current → récupérer l'utilisateur courant
exports.getCurrentUtilisateur = async (req, res) => {
  console.log('/current : Début de la gestion de la requête');

  try {
    console.log('/current : Utilisateur ID extrait du token :', req.user.userId);

    const utilisateur = await Utilisateur.findById(new mongoose.Types.ObjectId(req.user.userId));
    if (!utilisateur) {
      console.log('/current : Aucun utilisateur trouvé avec cet ID');
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    console.log('/current : Utilisateur trouvé, envoi de la réponse...');
    res.status(200).json(utilisateur);
  } catch (err) {
    console.error('/current : Erreur lors de la récupération des données utilisateur :', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des données utilisateur.' });
  }
};

// GET /api/utilisateur/:userId → récupérer un utilisateur par son ID (pour le forum)
exports.getUtilisateurById = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findById(req.params.userId).select('nom prenom');
    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(utilisateur);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};


// Créer un utilisateur
exports.createUtilisateur = async (req, res) => {
  try {
    let roles = req.body.roles || req.body['roles[]'];
    if (!Array.isArray(roles)) {
      roles = roles ? [roles] : [];
    }
    const photo = req.file ? req.file.filename : undefined;
    const { nom, prenom, email, plainPassword} = req.body;
    if (!nom || !prenom || !email || !plainPassword || roles.length === 0) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }
    const utilisateur = new Utilisateur({
      nom,
      prenom,
      email,
      mot_passe: plainPassword,
      photo,
      role: roles
    });
    await utilisateur.save();
    res.status(201).json(utilisateur);
  } catch (err) {
    console.error("Erreur lors de la création de l'utilisateur :", err);
    res.status(500).json({ message: "Erreur lors de la création de l'utilisateur", error: err.message });
  }
};

// Modifier un utilisateur
exports.updateUtilisateur = async (req, res) => {
  try {
    let roles = req.body.roles || req.body['roles[]'];
    if (!Array.isArray(roles)) {
      roles = roles ? [roles] : [];
    }
    const photo = req.file ? req.file.filename : undefined;
    const { nom, prenom, email, plainPassword} = req.body;
    const updateData = {
      nom,
      prenom,
      email,
      photo,
      role: roles
    };
    if (plainPassword) {
      updateData.mot_passe = plainPassword;
    }
    const utilisateur = await Utilisateur.findByIdAndUpdate(
      req.params.userId,
      updateData,
      { new: true }
    );
    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.json(utilisateur);
  } catch (err) {
    console.error("Erreur lors de la maj de l'utilisateur :", err);
    res.status(500).json({ message: "Erreur lors de la modification de l'utilisateur", error: err.message });
  }
};


const jwt = require("jsonwebtoken");
const User = require("../models/utilisateur.model");
const bcrypt = require("bcryptjs");

exports.login = async (req, res) => {
  const { email, mot_passe } = req.body;

  try {
    console.log(`Tentative de connexion : Email: ${email}`); // Étape 1 : Voir si la requête passe
    console.log("JWT_SECRET : ", process.env.JWT_SECRET);

    // Vérifiez si l'utilisateur existe dans la base
    const user = await User.findOne({ email });
    console.log('Requête User.findOne achevée'); // Étape 2 : Déboguer les erreurs au niveau de la base de données

    if (!user) {
      console.log('Erreur : utilisateur non trouvé');
      return res.status(401).json({ message: "Utilisateur non trouvé !" });
    }

    console.log('Utilisateur trouvé :', user);

    // Vérifiez si le mot de passe est correct
    const ismot_passeValid = await bcrypt.compare(mot_passe, user.mot_passe);
    console.log('Validation de mot_passe terminée'); // Étape 3 : Détecter les erreurs dans bcrypt.compare

    if (!ismot_passeValid) {
      console.log('Erreur : Mot de passe incorrect');
      return res.status(401).json({ message: "Mot de passe incorrect !" });
    }

    console.log('Mot de passe correct. Création du jeton...');

    // Génération du token
    const token = jwt.sign(
      {
        userId: user._id,
        roles: user.role },
        process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log('Token créé avec succès:', token);

    return res.status(200).json({
      message: "Connexion réussie",
      token: token,
      userId: user._id,
      roles: user.role,
    });

  } catch (error) {
    console.error('Erreur majeure dans login:', error.message); // Étape 4 : Attraper les erreurs globales
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

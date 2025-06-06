const jwt = require("jsonwebtoken");

// Middleware pour vérifier que l'utilisateur a un rôle spécifique
const verifyRole = (role) => {
  return (req, res, next) => {
    try {
      // Récupérer le token depuis les en-têtes
      const token = req.headers.authorization.split(" ")[1];
      if (!token) {
        return res.status(403).json({ message: "Accès non autorisé !" });
      }

      // Vérifier et décoder le token
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decodedToken; // Stocker les données du token pour utilisation

      // Vérifier si l'utilisateur a le rôle demandé
      if (!req.user.roles || !req.user.roles.includes(role)) {
        return res.status(403).json({ message: "Accès interdit, privilèges insuffisants" });
      }

      // Si tout est correct, passer au contrôleur suivant
      next();
    } catch (error) {
      return res.status(401).json({ message: "Authentification invalide ou expirée" });
    }
  };
};

module.exports = verifyRole;

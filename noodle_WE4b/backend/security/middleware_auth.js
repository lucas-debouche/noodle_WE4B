const jwt = require('jsonwebtoken');

module.exports = (rolesAutorises) => (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log('authMiddleware : Aucun token trouvé dans le header.');
    return res.status(401).json({ error: "Aucun token fourni." });
  }

  const token = authHeader.split(' ')[1]; // Extraire le token Bearer
  jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
    if (err) {
      console.log('authMiddleware : Erreur de validation du token.', err);
      return res.status(401).json({ error: "Token non valide." });
    }

    console.log('authMiddleware : Token décodé avec succès.', decodedToken);
    req.user = decodedToken;

    // Vérifier les rôles autorisés
    if (!rolesAutorises.some((role) => decodedToken.roles.includes(role))) {
      console.log('authMiddleware : Accès refusé, rôle non autorisé.');
      return res.status(403).json({ error: "Accès refusé." });
    }

    next();
  });
};

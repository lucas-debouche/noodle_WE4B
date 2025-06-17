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

    // Vérification de l'inactivité
    const currentTime = Math.floor(Date.now() / 1000); // Temps actuel en secondes
    if (currentTime - decodedToken.lastActivity > 20 * 60) { // 20 minutes d'inactivité
      console.log('authMiddleware : Token expiré en raison d\'inactivité.');
      return res.status(401).json({ error: "Session expirée en raison d'inactivité." });
    }

    // Génère un nouveau token avec la nouvelle activité
    const newToken = jwt.sign(
      {
        userId: decodedToken.userId,
        roles: decodedToken.roles,
        lastActivity: currentTime,
      },
      process.env.JWT_SECRET,
      { expiresIn: "10h" }
    );
    res.setHeader('x-refresh-token', newToken);

    req.user = { ...decodedToken, lastActivity: currentTime };


    // Vérifier les rôles autorisés
    if (!rolesAutorises.some((role) => decodedToken.roles.includes(role))) {
      console.log('authMiddleware : Accès refusé, rôle non autorisé.');
      return res.status(403).json({ error: "Accès refusé." });
    }

    next();
  });
};

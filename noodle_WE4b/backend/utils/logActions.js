// utils/logActions.js - Fonction de nettoyage des références circulaires

/**
 * Nettoie un objet de ses références circulaires pour MongoDB
 * @param {any} obj - L'objet à nettoyer
 * @param {Set} seen - Set des objets déjà vus (pour éviter les cycles)
 * @returns {any} - L'objet nettoyé
 */
function sanitizeForMongoDB(obj, seen = new Set()) {
  // Types primitifs - retour direct
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Déjà vu - référence circulaire détectée
  if (seen.has(obj)) {
    return '[Circular Reference]';
  }

  // Objets MongoDB - convertir en string
  if (obj._id || obj.constructor.name === 'ObjectId') {
    return obj.toString();
  }

  // Dates
  if (obj instanceof Date) {
    return obj;
  }

  // Ajouter à la liste des objets vus
  seen.add(obj);

  // Arrays
  if (Array.isArray(obj)) {
    const result = obj.map(item => sanitizeForMongoDB(item, seen));
    seen.delete(obj);
    return result;
  }

  // Objects
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    // Ignorer certaines propriétés problématiques
    if (key.startsWith('$') || key === '__v' || key === 'constructor') {
      continue;
    }

    try {
      result[key] = sanitizeForMongoDB(value, seen);
    } catch (error) {
      result[key] = '[Cannot Serialize]';
    }
  }

  seen.delete(obj);
  return result;
}


async function logAction(logData) {
  try {
    // Nettoyer les données avant sauvegarde
    const sanitizedData = {
      action: logData.action,
      category: logData.category,
      userId: logData.userId ? logData.userId.toString() : null,
      targetId: logData.targetId ? logData.targetId.toString() : null,
      timestamp: new Date(),
      details: sanitizeForMongoDB(logData.details || {})
    };

    // Limiter la taille des détails (optionnel)
    const detailsString = JSON.stringify(sanitizedData.details);
    if (detailsString.length > 10000) { // 10KB max
      sanitizedData.details = {
        ...sanitizedData.details,
        _note: 'Données tronquées pour éviter la surcharge'
      };
    }

    // Sauvegarder en base
    const Log = require('../models/logs.model');
    const log = new Log(sanitizedData);
    await log.save();

  } catch (error) {
    // Ne pas faire échouer l'opération principale si le log échoue
    console.error('❌ Erreur lors du logging (non bloquante):', error.message);
    console.error("Log problématique : ", logData.action, logData.category, logData.userId, logData.targetId, logData.details);
  }
}

module.exports = { logAction, sanitizeForMongoDB };

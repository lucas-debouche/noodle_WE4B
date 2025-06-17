const Log = require('../models/logs.model');

async function logAction({ action, category, userId, targetId = null, details = {} }) {
  try {
    await Log.create({ action, category, userId, targetId, details });
  } catch (error) {
    console.error('Erreur lors de la création du log :', error);
  }
}

module.exports = { logAction };

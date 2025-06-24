const express = require('express');
const router = express.Router();
const Departement = require('../models/departement.model');
const { logAction } = require('../utils/logActions');

// GET /api/departements/search - Rechercher des départements
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const departements = await Departement.find({
      $or: [
        { nom: searchRegex },
        { description: searchRegex },
        { code: searchRegex }
      ],
      actif: true
    })
      .populate('responsable', 'nom prenom email')
      .sort({ nom: 1 })
      .limit(20);

    res.json({
      success: true,
      data: departements
    });

  } catch (error) {
    console.error('Erreur lors de la recherche de départements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/departements/actifs - Récupérer seulement les départements actifs
router.get('/actifs', async (req, res) => {
  try {
    const departements = await Departement.findActifs()
      .populate('responsable', 'nom prenom email');

    res.json({
      success: true,
      data: departements
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des départements actifs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/departements - Récupérer tous les départements
router.get('/', async (req, res) => {
  try {
    const departements = await Departement.find()
      .populate('responsable', 'nom prenom email')
      .sort({ nom: 1 });

    res.json({
      success: true,
      data: departements
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des départements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/departements/:id - Récupérer un département par ID
router.get('/:id', async (req, res) => {
  try {
    const departement = await Departement.findById(req.params.id)
      .populate('responsable', 'nom prenom email');

    if (!departement) {
      return res.status(404).json({
        success: false,
        message: 'Département non trouvé'
      });
    }

    res.json({
      success: true,
      data: departement
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du département:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/departements - Créer un nouveau département
router.post('/', async (req, res) => {
  try {
    const { nom, description, code, responsable } = req.body;

    // Validation
    if (!nom || nom.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du département est requis'
      });
    }

    const nouveauDepartement = new Departement({
      nom: nom.trim(),
      description: description ? description.trim() : '',
      code: code ? code.trim().toUpperCase() : '',
      responsable: responsable || null
    });

    const departementSauve = await nouveauDepartement.save();

    // Logger l'action
    try {
      await logAction({
        action: 'create_departement',
        category: 'departement',
        userId: req.user ? req.user.userId : null,
        targetId: departementSauve._id.toString(),
        details: { nom: departementSauve.nom }
      });
    } catch (logError) {
      console.log('⚠️ Erreur de logging (non bloquante):', logError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Département créé avec succès',
      data: departementSauve
    });

  } catch (error) {
    console.error('Erreur lors de la création du département:', error);

    if (error.message.includes('existe déjà')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du département'
    });
  }
});

// PUT /api/departements/:id - Modifier un département
router.put('/:id', async (req, res) => {
  try {
    const { nom, description, code, responsable, actif } = req.body;

    const departement = await Departement.findById(req.params.id);
    if (!departement) {
      return res.status(404).json({
        success: false,
        message: 'Département non trouvé'
      });
    }

    // Mettre à jour les champs
    if (nom !== undefined) departement.nom = nom.trim();
    if (description !== undefined) departement.description = description.trim();
    if (code !== undefined) departement.code = code.trim().toUpperCase();
    if (responsable !== undefined) departement.responsable = responsable;
    if (actif !== undefined) departement.actif = actif;

    const departementMisAJour = await departement.save();

    // Logger l'action
    try {
      await logAction({
        action: 'update_departement',
        category: 'departement',
        userId: req.user ? req.user.userId : null,
        targetId: departementMisAJour._id.toString(),
        details: { nom: departementMisAJour.nom }
      });
    } catch (logError) {
      console.log('⚠️ Erreur de logging (non bloquante):', logError.message);
    }

    res.json({
      success: true,
      message: 'Département mis à jour avec succès',
      data: departementMisAJour
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du département:', error);

    if (error.message.includes('existe déjà')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du département'
    });
  }
});

// DELETE /api/departements/:id - Supprimer un département
router.delete('/:id', async (req, res) => {
  try {
    const departement = await Departement.findById(req.params.id);
    if (!departement) {
      return res.status(404).json({
        success: false,
        message: 'Département non trouvé'
      });
    }

    // Vérifier s'il y a des UE associées à ce département
    const Ue = require('../models/ue.model');
    const uesAssociees = await Ue.countDocuments({ departementId: req.params.id });

    if (uesAssociees > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer ce département car ${uesAssociees} UE(s) y sont associées`
      });
    }

    await Departement.findByIdAndDelete(req.params.id);

    // Logger l'action
    try {
      await logAction({
        action: 'delete_departement',
        category: 'departement',
        userId: req.user ? req.user.userId : null,
        targetId: req.params.id,
        details: { nom: departement.nom }
      });
    } catch (logError) {
      console.log('⚠️ Erreur de logging (non bloquante):', logError.message);
    }

    res.json({
      success: true,
      message: 'Département supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du département:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du département'
    });
  }
});

module.exports = router;

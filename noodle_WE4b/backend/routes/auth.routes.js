const express = require('express');
const router = express.Router();
const authController = require('../security/authController');

// Route de connexion
router.post('/login', authController.login);

module.exports = router;

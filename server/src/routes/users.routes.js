const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const authMiddleware = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// All user management routes require admin authentication
router.use(authMiddleware);
router.use(adminOnly);

router.get('/', usersController.getAllUsers);
router.post('/', usersController.createUser);
router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

module.exports = router;

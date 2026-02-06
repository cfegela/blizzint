const express = require('express');
const authRoutes = require('./auth.routes');
const resortsRoutes = require('./resorts.routes');
const usersRoutes = require('./users.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/resorts', resortsRoutes);
router.use('/users', usersRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Blizzint API is running' });
});

module.exports = router;

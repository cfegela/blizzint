const express = require('express');
const { body } = require('express-validator');
const resortsController = require('../controllers/resorts.controller');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

const resortValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('country').isLength({ min: 2, max: 3 }).withMessage('Valid country code is required'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  validate,
];

router.get('/', resortsController.getResorts);
router.get('/search', resortsController.searchResorts);
router.get('/nearby', resortsController.getNearbyResorts);
router.get('/:idOrSlug', resortsController.getResortByIdOrSlug);

router.post(
  '/',
  authMiddleware,
  adminOnly,
  resortValidation,
  resortsController.createResort
);

router.put(
  '/:id',
  authMiddleware,
  adminOnly,
  resortsController.updateResort
);

router.delete(
  '/:id',
  authMiddleware,
  adminOnly,
  resortsController.deleteResort
);

module.exports = router;

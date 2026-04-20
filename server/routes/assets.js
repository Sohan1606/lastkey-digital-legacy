const express = require('express');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { 
  createAsset, 
  getAssets, 
  updateAsset, 
  deleteAsset 
} = require('../controllers/assetController');
const { validate, createAssetSchema, updateAssetSchema } = require('../validators');

const router = express.Router();

// Vault rate limiting - stricter than general API
const vaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 vault operations per 15 minutes
  message: { status: 'fail', message: 'Too many vault requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(protect);
router.use(vaultLimiter);

router
  .route('/')
  .post(validate(createAssetSchema), createAsset)
  .get(getAssets);

router
  .route('/:id')
  .put(validate(updateAssetSchema), updateAsset)
  .delete(deleteAsset);

module.exports = router;

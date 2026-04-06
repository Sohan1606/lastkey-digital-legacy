const express = require('express');
const { protect } = require('../middleware/auth');
const { 
  createAsset, 
  getAssets, 
  updateAsset, 
  deleteAsset 
} = require('../controllers/assetController');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(createAsset)
  .get(getAssets);

router
  .route('/:id')
  .put(updateAsset)
  .delete(deleteAsset);

module.exports = router;

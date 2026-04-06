const express = require('express');
const { protect } = require('../middleware/auth');
const { 
  getMyCapsules, 
  createCapsule, 
  updateCapsule, 
  deleteCapsule 
} = require('../controllers/capsuleController');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getMyCapsules)
  .post(createCapsule);

router
  .route('/:id')
  .patch(updateCapsule)
  .delete(deleteCapsule);

module.exports = router;

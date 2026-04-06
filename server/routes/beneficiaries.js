const express = require('express');
const { protect } = require('../middleware/auth');
const { 
  getAllBeneficiaries, 
  createBeneficiary, 
  updateBeneficiary, 
  deleteBeneficiary 
} = require('../controllers/beneficiaryController');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getAllBeneficiaries)
  .post(createBeneficiary);

router
  .route('/:id')
  .patch(updateBeneficiary)
  .delete(deleteBeneficiary);

module.exports = router;

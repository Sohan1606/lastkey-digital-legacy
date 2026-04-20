const express = require('express');
const { protect } = require('../middleware/auth');
const { 
  getAllBeneficiaries, 
  createBeneficiary, 
  updateBeneficiary, 
  deleteBeneficiary 
} = require('../controllers/beneficiaryController');
const { validate, createBeneficiarySchema, updateBeneficiarySchema } = require('../validators');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getAllBeneficiaries)
  .post(validate(createBeneficiarySchema), createBeneficiary);

router
  .route('/:id')
  .patch(validate(updateBeneficiarySchema), updateBeneficiary)
  .delete(deleteBeneficiary);

module.exports = router;

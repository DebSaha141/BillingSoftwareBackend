const express = require('express');
const router = express.Router();
const {
  getAllBills,
  getBillByUuid,
  deleteBill,
} = require('../controllers/billController');

router.route('/')
  .get(getAllBills);

router.route('/:uuid')
  .get(getBillByUuid)
  .delete(deleteBill);

module.exports = router;
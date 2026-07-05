const express = require("express");
const router = express.Router();
const {
  getAllBills,
  getBillByUuid,
  updateBill,
  deleteBill,
} = require("../controllers/billController");

router.route("/").get(getAllBills);

router.route("/:uuid").get(getBillByUuid).patch(updateBill).delete(deleteBill);

module.exports = router;

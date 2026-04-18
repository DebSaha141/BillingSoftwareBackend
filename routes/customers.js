const express = require("express");
const router = express.Router();
const {
  getAllCustomers,
  getCustomerByUuid,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");

router.route("/").get(getAllCustomers).post(createCustomer);

router
  .route("/:uuid")
  .get(getCustomerByUuid)
  .put(updateCustomer)
  .delete(deleteCustomer);

module.exports = router;

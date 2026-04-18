const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductByUuid,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} = require('../controllers/productController');

// GET /api/products/categories/list — must be before /:uuid
router.get('/categories/list', getCategories);

router.route('/')
  .get(getAllProducts)
  .post(createProduct);

router.route('/:uuid')
  .get(getProductByUuid)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;
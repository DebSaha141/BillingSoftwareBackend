const Product = require('../models/Product');

/**
 * These endpoints are NOT used by the Flutter app for normal operations.
 * The app uses Isar locally + sync endpoints.
 * 
 * These exist for:
 * - Future web dashboard
 * - Direct API testing
 * - Admin operations
 * - Debugging
 */

// GET /api/products
const getAllProducts = async (req, res, next) => {
  try {
    const { search, category, includeDeleted } = req.query;

    const filter = {};

    // By default, exclude deleted products
    if (includeDeleted !== 'true') {
      filter.isDeleted = false;
    }

    // Search by name
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    const products = await Product.find(filter)
      .select('-__v')
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:uuid
const getProductByUuid = async (req, res, next) => {
  try {
    const product = await Product.findOne({ uuid: req.params.uuid })
      .select('-__v')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create({
      ...req.body,
      createdAt: req.body.createdAt || new Date(),
      updatedAt: req.body.updatedAt || new Date(),
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:uuid
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      { uuid: req.params.uuid },
      {
        ...req.body,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:uuid (soft delete)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      { uuid: req.params.uuid },
      {
        isDeleted: true,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted (soft)',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/categories/list
const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', {
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      data: categories.sort(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductByUuid,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
};
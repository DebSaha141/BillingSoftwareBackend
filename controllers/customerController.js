const Customer = require("../models/Customer");

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

// GET /api/customers
const getAllCustomers = async (req, res, next) => {
  try {
    const { search, includeDeleted } = req.query;

    const filter = {};

    // By default, exclude deleted customers
    if (includeDeleted !== "true") {
      filter.isDeleted = false;
    }

    // Search by name or phone
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const customers = await Customer.find(filter)
      .select("-__v")
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/customers/:uuid
const getCustomerByUuid = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ uuid: req.params.uuid })
      .select("-__v")
      .lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/customers
const createCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.create({
      ...req.body,
      createdAt: req.body.createdAt || new Date(),
      updatedAt: req.body.updatedAt || new Date(),
    });

    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/customers/:uuid
const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { uuid: req.params.uuid },
      {
        ...req.body,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true },
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/customers/:uuid (soft delete)
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { uuid: req.params.uuid },
      {
        isDeleted: true,
        updatedAt: new Date(),
      },
      { new: true },
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer deleted (soft)",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCustomers,
  getCustomerByUuid,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};

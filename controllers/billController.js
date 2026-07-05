const Bill = require("../models/Bill");

const normalizeBillPayload = (body, uuid) => {
  const timestamp = body.timestamp ?? body.createdAt;

  return {
    ...body,
    uuid,
    timestamp,
    createdAt: timestamp,
    items: body.items,
    updatedAt: body.updatedAt ? body.updatedAt : new Date(),
  };
};

// GET /api/bills
const getAllBills = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      search,
      paymentMethod,
    } = req.query;

    const filter = { isDeleted: false };

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Search by bill number or customer name/phone
    if (search) {
      filter.$or = [
        { billNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by payment method
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bills, total] = await Promise.all([
      Bill.find(filter)
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Bill.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: bills.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: bills,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bills/:uuid
const getBillByUuid = async (req, res, next) => {
  try {
    const bill = await Bill.findOne({ uuid: req.params.uuid })
      .select("-__v")
      .lean();

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: "Bill not found",
      });
    }

    res.status(200).json({
      success: true,
      data: bill,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/bills/:uuid
// Accepts the full bill payload so the frontend can edit an existing bill atomically.
const updateBill = async (req, res, next) => {
  try {
    const payload = normalizeBillPayload(req.body, req.params.uuid);

    const bill = await Bill.findOneAndUpdate(
      { uuid: req.params.uuid },
      payload,
      {
        new: true,
        runValidators: true,
        context: "query",
      },
    );

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: "Bill not found",
      });
    }

    res.status(200).json({
      success: true,
      data: bill,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/bills/:uuid (soft delete)
const deleteBill = async (req, res, next) => {
  try {
    const bill = await Bill.findOneAndUpdate(
      { uuid: req.params.uuid },
      {
        isDeleted: true,
        updatedAt: new Date(),
      },
      { new: true },
    );

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: "Bill not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bill deleted (soft)",
      data: bill,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBills,
  getBillByUuid,
  updateBill,
  deleteBill,
};

const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Bill = require("../models/Bill");
const StoreSettings = require("../models/StoreSettings");

/**
 * PUSH SYNC — App sends unsynced local data to cloud
 * POST /api/sync/push
 *
 * This is the most critical endpoint.
 * The app batches all records where isSynced=false and sends them here.
 * We use upsert (update if exists, insert if not) based on uuid.
 */
const pushSync = async (req, res, next) => {
  try {
    const {
      products = [],
      customers = [],
      bills = [],
      settings = null,
    } = req.body;

    const results = {
      products: { received: 0, errors: [] },
      customers: { received: 0, errors: [] },
      bills: { received: 0, errors: [] },
      settings: { received: false },
    };

    // --- PUSH PRODUCTS ---
    for (const product of products) {
      try {
        await Product.findOneAndUpdate(
          { uuid: product.uuid },
          {
            uuid: product.uuid,
            name: product.name,
            price: product.price,
            unit: product.unit,
            category: product.category || "General",
            isDeleted: product.isDeleted || false,
            createdAt: new Date(product.createdAt),
            updatedAt: new Date(product.updatedAt),
          },
          {
            upsert: true, // Create if doesn't exist
            new: true, // Return the updated document
            runValidators: true,
          },
        );
        results.products.received++;
      } catch (err) {
        results.products.errors.push({
          uuid: product.uuid,
          error: err.message,
        });
      }
    }

    // --- PUSH CUSTOMERS ---
    for (const customer of customers) {
      try {
        await Customer.findOneAndUpdate(
          { uuid: customer.uuid },
          {
            uuid: customer.uuid,
            name: customer.name,
            phone: customer.phone || "",
            isDeleted: customer.isDeleted || false,
            createdAt: new Date(customer.createdAt),
            updatedAt: new Date(customer.updatedAt),
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          },
        );
        results.customers.received++;
      } catch (err) {
        results.customers.errors.push({
          uuid: customer.uuid,
          error: err.message,
        });
      }
    }

    // --- PUSH BILLS ---
    for (const bill of bills) {
      try {
        await Bill.findOneAndUpdate(
          { uuid: bill.uuid },
          {
            uuid: bill.uuid,
            billNumber: bill.billNumber,
            items: bill.items,
            subtotal: bill.subtotal,
            discountPercent: bill.discountPercent || 0,
            discountAmount: bill.discountAmount || 0,
            taxPercent: bill.taxPercent || 0,
            taxAmount: bill.taxAmount || 0,
            grandTotal: bill.grandTotal,
            paymentMethod: bill.paymentMethod || "cash",
            customerName: bill.customerName || "",
            customerPhone: bill.customerPhone || "",
            isDeleted: bill.isDeleted || false,
            createdAt: new Date(bill.createdAt),
            updatedAt: new Date(bill.updatedAt),
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          },
        );
        results.bills.received++;
      } catch (err) {
        results.bills.errors.push({
          uuid: bill.uuid,
          error: err.message,
        });
      }
    }

    // --- PUSH SETTINGS ---
    if (settings) {
      try {
        await StoreSettings.findOneAndUpdate(
          { uuid: "store-settings-singleton" },
          {
            ...settings,
            uuid: "store-settings-singleton",
            updatedAt: new Date(settings.updatedAt),
          },
          { upsert: true, new: true },
        );
        results.settings.received = true;
      } catch (err) {
        results.settings.error = err.message;
      }
    }

    res.status(200).json({
      success: true,
      message: "Push sync completed",
      results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PULL SYNC — App requests changes since last sync
 * GET /api/sync/pull?since=2025-06-11T00:00:00.000Z
 *
 * Returns all records modified after the given timestamp.
 * For single device this is usually empty, but handles:
 * - First install (since=epoch 0 → returns everything)
 * - Future web dashboard edits
 * - Data recovery scenarios
 */
const pullSync = async (req, res, next) => {
  try {
    const since = req.query.since ? new Date(req.query.since) : new Date(0); // If no timestamp, send everything

    // Validate the date
    if (isNaN(since.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid "since" timestamp',
      });
    }

    // Get products updated after the timestamp
    const products = await Product.find({
      updatedAt: { $gt: since },
    })
      .select("-_id -__v") // Exclude MongoDB internal fields
      .lean();

    // Get customers updated after the timestamp
    const customers = await Customer.find({
      updatedAt: { $gt: since },
    })
      .select("-_id -__v")
      .lean();

    // Get bills updated after the timestamp
    // Limit to recent 3 months for performance on full download
    const billDateLimit =
      since.getTime() === 0
        ? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 3 months ago
        : since;

    const bills = await Bill.find({
      updatedAt: { $gt: since },
      createdAt: { $gte: billDateLimit },
    })
      .select("-_id -__v")
      .lean();

    // Get settings (always send it)
    const settings = await StoreSettings.findOne({
      uuid: "store-settings-singleton",
    })
      .select("-_id -__v")
      .lean();

    res.status(200).json({
      success: true,
      message: "Pull sync completed",
      data: {
        products,
        customers,
        bills,
        settings,
      },
      meta: {
        productCount: products.length,
        customerCount: customers.length,
        billCount: bills.length,
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * FULL DOWNLOAD — First install, get everything
 * POST /api/sync/full-download
 *
 * Separate from pull because:
 * - We might want to paginate bills
 * - Products are always sent in full
 * - Bills limited to recent 3 months
 * - Can extend later for pagination
 */
const fullDownload = async (req, res, next) => {
  try {
    // All active products
    const products = await Product.find({ isDeleted: false })
      .select("-_id -__v")
      .lean();

    // All active customers
    const customers = await Customer.find({ isDeleted: false })
      .select("-_id -__v")
      .lean();

    // Bills from last 3 months only
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const bills = await Bill.find({
      isDeleted: false,
      createdAt: { $gte: threeMonthsAgo },
    })
      .select("-_id -__v")
      .sort({ createdAt: -1 })
      .lean();

    // Store settings
    const settings = await StoreSettings.findOne({
      uuid: "store-settings-singleton",
    })
      .select("-_id -__v")
      .lean();

    res.status(200).json({
      success: true,
      message: "Full download completed",
      data: {
        products,
        customers,
        bills,
        settings,
      },
      meta: {
        productCount: products.length,
        customerCount: customers.length,
        billCount: bills.length,
        billsFrom: threeMonthsAgo.toISOString(),
        downloadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  pushSync,
  pullSync,
  fullDownload,
};

const mongoose = require("mongoose");

// Embedded subdocument — each item in the bill
const billItemSchema = new mongoose.Schema(
  {
    productUuid: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
); // No need for separate _id on embedded docs

const billSchema = new mongoose.Schema({
  uuid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  billNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  items: {
    type: [billItemSchema],
    required: true,
    validate: {
      validator: function (items) {
        return items.length > 0;
      },
      message: "Bill must have at least one item",
    },
  },

  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },

  // Discount on total bill
  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Optional tax on total
  taxPercent: {
    type: Number,
    default: 0,
    min: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0,
  },

  grandTotal: {
    type: Number,
    required: true,
    min: 0,
  },

  paymentMethod: {
    type: String,
    enum: ["cash", "upi", "card", "mixed", "credit"],
    default: "cash",
  },

  // Optional customer info
  customerName: {
    type: String,
    trim: true,
    default: "",
  },
  customerPhone: {
    type: String,
    trim: true,
    default: "",
  },

  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },

  // Client-managed timestamps
  createdAt: {
    type: Date,
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
    index: true,
  },
});

// Index for dashboard queries
// "Get all bills for today" or "bills in date range"
billSchema.index({ createdAt: -1 });
billSchema.index({ createdAt: 1, isDeleted: 1 });

// Index for sync
billSchema.index({ updatedAt: 1, isDeleted: 1 });

// Index for searching bills by customer
billSchema.index({ customerPhone: 1 });

module.exports = mongoose.model("Bill", billSchema);

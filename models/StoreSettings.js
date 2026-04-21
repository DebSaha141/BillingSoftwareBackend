const mongoose = require("mongoose");

const storeSettingsSchema = new mongoose.Schema({
  // Singleton — only one document ever exists
  // We use a fixed uuid so upsert always hits the same doc
  uuid: {
    type: String,
    default: "store-settings-singleton",
    unique: true,
  },

  storeName: {
    type: String,
    default: "My Store",
    trim: true,
  },

  storeSmallName: {
    type: String,
    default: "",
    trim: true,
  },

  address: {
    type: String,
    default: "",
    trim: true,
  },

  phone: {
    type: String,
    default: "",
    trim: true,
  },

  // Optional tax/registration number
  registrationNumber: {
    type: String,
    default: "",
    trim: true,
  },

  // Receipt customization
  receiptHeader: {
    type: String,
    default: "",
    trim: true,
  },
  receiptFooter: {
    type: String,
    default: "Thank you! Visit again!",
    trim: true,
  },

  // Bill numbering
  billPrefix: {
    type: String,
    default: "BILL",
    trim: true,
  },

  // Currency symbol
  currencySymbol: {
    type: String,
    default: "₹",
  },

  // Printer settings
  paperWidth: {
    type: Number,
    enum: [58, 80],
    default: 80,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("StoreSettings", storeSettingsSchema);

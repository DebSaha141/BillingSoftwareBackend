const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  // UUID generated on the Flutter app (client-side)
  // This is the shared identifier between Isar and MongoDB
  uuid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  name: {
    type: String,
    required: true,
    trim: true,
  },

  price: {
    type: Number,
    required: true,
    min: 0,
  },

  sellingPrice: {
    type: Number,
    min: 0,
    default: function () {
      return this.price;
    },
  },

  unit: {
    type: String,
    required: true,
    enum: ["kg", "g", "piece", "liter", "ml", "packet", "dozen", "box"],
    default: "piece",
  },

  category: {
    type: String,
    trim: true,
    default: "General",
  },

  // Soft delete — never hard delete, sync needs to know about deletions
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },

  // Timestamps managed by the client (Flutter app)
  // We trust client timestamps since it's a single device
  createdAt: {
    type: Date,
    required: true,
  },

  updatedAt: {
    type: Date,
    required: true,
    index: true, // Critical for pull sync: "give me everything after X"
  },
});

// Compound index for sync pull queries
// "Get all non-deleted products updated after timestamp X"
productSchema.index({ updatedAt: 1, isDeleted: 1 });

// Text index for search (if we ever need server-side search)
productSchema.index({ name: "text" });

module.exports = mongoose.model("Product", productSchema);

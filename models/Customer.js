const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
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

  phone: {
    type: String,
    trim: true,
    default: "",
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
// "Get all non-deleted customers updated after timestamp X"
customerSchema.index({ updatedAt: 1, isDeleted: 1 });

// Text index for search (if we ever need server-side search)
customerSchema.index({ name: "text" });

module.exports = mongoose.model("Customer", customerSchema);

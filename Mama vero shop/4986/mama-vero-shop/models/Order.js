const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    // Snapshot fields - preserved even if the product is later edited/deleted,
    // so historical orders always display correctly.
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    paymentProof: {
      objectPath: { type: String, default: null }, // GCS object path (private)
      uploadedAt: { type: Date, default: null },
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },

    orderStatus: {
      type: String,
      enum: ['pending', 'preparing', 'ready_for_pickup', 'completed', 'cancelled'],
      default: 'pending',
    },

    customerSnapshot: {
      name: String,
      email: String,
      phone: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);

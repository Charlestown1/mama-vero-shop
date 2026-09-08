const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const generateOrderNumber = require('../utils/generateOrderNumber');
const { uploadBuffer, getSignedUrl } = require('../config/googleCloud');

/**
 * POST /api/orders
 * Creates an order from a list of { productId, quantity }.
 * CRITICAL: stock is re-verified against MongoDB here - the browser's
 * numbers are never trusted. Each product's stock is decremented
 * atomically so two simultaneous orders can never oversell the same item.
 */
exports.createOrder = async (req, res, next) => {
  const { items } = req.body; // [{ productId, quantity }]

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Your cart is empty.' });
  }

  const session = await mongoose.startSession();
  try {
    let orderItems = [];
    let totalAmount = 0;

    await session.withTransaction(async () => {
      for (const { productId, quantity } of items) {
        const qty = Number(quantity);
        if (!productId || !Number.isInteger(qty) || qty < 1) {
          throw Object.assign(new Error('Invalid item in cart.'), { statusCode: 400, publicMessage: 'Invalid item in cart.' });
        }

        // Atomic conditional decrement: only succeeds if enough stock exists.
        const product = await Product.findOneAndUpdate(
          { _id: productId, isAvailable: true, stockQuantity: { $gte: qty } },
          { $inc: { stockQuantity: -qty } },
          { new: true, session }
        );

        if (!product) {
          const existing = await Product.findById(productId).session(session);
          const name = existing ? existing.name : 'This product';
          throw Object.assign(
            new Error('Insufficient stock'),
            { statusCode: 400, publicMessage: `${name} is currently out of stock or has insufficient quantity available.` }
          );
        }

        const subtotal = product.price * qty;
        totalAmount += subtotal;
        orderItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: qty,
          subtotal,
        });
      }
    });

    const orderNumber = await generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      items: orderItems,
      totalAmount,
      customerSnapshot: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
      },
    });

    res.status(201).json({ success: true, message: 'Your order has been placed.', order });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};

// GET /api/orders - current user's own order history
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id - a single order, only if it belongs to the requester
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// POST /api/orders/:id/payment-proof
exports.uploadPaymentProof = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please attach a payment screenshot.' });
    }

    const objectPath = await uploadBuffer(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'payment-proofs'
    );

    order.paymentProof = { objectPath, uploadedAt: new Date() };
    order.paymentStatus = 'pending'; // uploading proof never auto-verifies payment
    await order.save();

    res.json({ success: true, message: 'Your payment proof has been uploaded successfully.', order });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id/payment-proof-url - signed URL for the CURRENT user's own order
exports.getMyPaymentProofUrl = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order || !order.paymentProof || !order.paymentProof.objectPath) {
      return res.status(404).json({ success: false, message: 'No payment proof found for this order.' });
    }
    const url = await getSignedUrl(order.paymentProof.objectPath);
    res.json({ success: true, url });
  } catch (err) {
    next(err);
  }
};

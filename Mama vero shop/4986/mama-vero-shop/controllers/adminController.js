const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { uploadBuffer, uploadPublicBuffer, getSignedUrl, deleteObject } = require('../config/googleCloud');

// ---------- Dashboard overview ----------
exports.getOverview = async (req, res, next) => {
  try {
    const [totalProducts, inStock, outOfStock, totalOrders, pendingPayments, verifiedPayments,
      preparing, readyForPickup, completed, revenueAgg] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ stockQuantity: { $gt: 0 } }),
      Product.countDocuments({ stockQuantity: { $lte: 0 } }),
      Order.countDocuments({}),
      Order.countDocuments({ paymentStatus: 'pending' }),
      Order.countDocuments({ paymentStatus: 'verified' }),
      Order.countDocuments({ orderStatus: 'preparing' }),
      Order.countDocuments({ orderStatus: 'ready_for_pickup' }),
      Order.countDocuments({ orderStatus: 'completed' }),
      Order.aggregate([
        { $match: { paymentStatus: 'verified' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    res.json({
      success: true,
      overview: {
        totalProducts,
        inStock,
        outOfStock,
        totalOrders,
        pendingPayments,
        verifiedPayments,
        preparing,
        readyForPickup,
        completed,
        revenue: revenueAgg[0] ? revenueAgg[0].total : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ---------- Product management ----------
exports.getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, category, price, stockQuantity, isAvailable } = req.body;
    if (!name || !category || price === undefined) {
      return res.status(400).json({ success: false, message: 'Name, category, and price are required.' });
    }

    let image = '';
    if (req.file) {
      image = await uploadPublicBuffer(req.file.buffer, req.file.originalname, req.file.mimetype, 'products');
    }

    const product = await Product.create({
      name,
      description: description || '',
      category,
      price: Number(price),
      stockQuantity: Number(stockQuantity) || 0,
      isAvailable: isAvailable === undefined ? true : isAvailable === 'true' || isAvailable === true,
      image,
    });

    res.status(201).json({ success: true, message: 'Product added successfully.', product });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const { name, description, category, price, stockQuantity, isAvailable } = req.body;
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (price !== undefined) product.price = Number(price);
    if (stockQuantity !== undefined) product.stockQuantity = Number(stockQuantity);
    if (isAvailable !== undefined) product.isAvailable = isAvailable === 'true' || isAvailable === true;

    if (req.file) {
      const oldImage = product.image;
      product.image = await uploadPublicBuffer(req.file.buffer, req.file.originalname, req.file.mimetype, 'products');
      if (oldImage) await deleteObject(oldImage);
    }

    await product.save();
    res.json({ success: true, message: 'Product updated successfully.', product });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    if (product.image) await deleteObject(product.image);
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// ---------- Customers ----------
exports.getCustomers = async (req, res, next) => {
  try {
    const customers = await User.find({ role: 'customer' }).sort({ createdAt: -1 });
    res.json({ success: true, customers: customers.map((c) => c.toSafeObject()) });
  } catch (err) {
    next(err);
  }
};

// ---------- Orders ----------
exports.getAllOrders = async (req, res, next) => {
  try {
    const { paymentStatus, orderStatus } = req.query;
    const query = {};
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (orderStatus) query.orderStatus = orderStatus;

    const orders = await Order.find(query).populate('user', 'name email phone').sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

exports.getPaymentProofUrl = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || !order.paymentProof || !order.paymentProof.objectPath) {
      return res.status(404).json({ success: false, message: 'No payment proof found for this order.' });
    }
    const url = await getSignedUrl(order.paymentProof.objectPath);
    res.json({ success: true, url });
  } catch (err) {
    next(err);
  }
};

exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'verified' | 'rejected'
    if (!['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status.' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    order.paymentStatus = status;
    await order.save();
    res.json({ success: true, message: `Payment marked as ${status}.`, order });
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'preparing', 'ready_for_pickup', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // If cancelling, restock the items.
    if (status === 'cancelled' && order.orderStatus !== 'cancelled') {
      const Product = require('../models/Product');
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stockQuantity: item.quantity } });
      }
    }

    order.orderStatus = status;
    await order.save();
    res.json({ success: true, message: 'Order status updated successfully.', order });
  } catch (err) {
    next(err);
  }
};

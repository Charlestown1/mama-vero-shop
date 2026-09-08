const Order = require('../models/Order');

/**
 * Generates a unique order number like MVS-20260908-001.
 * Uses a same-day count so numbers stay short and human-readable.
 */
async function generateOrderNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const datePart = `${y}${m}${d}`;

  const startOfDay = new Date(y, now.getMonth(), now.getDate());
  const endOfDay = new Date(y, now.getMonth(), now.getDate() + 1);

  const countToday = await Order.countDocuments({
    createdAt: { $gte: startOfDay, $lt: endOfDay },
  });

  const sequence = String(countToday + 1).padStart(3, '0');
  const candidate = `MVS-${datePart}-${sequence}`;

  // Extremely unlikely collision guard (concurrent orders in the same ms window)
  const exists = await Order.findOne({ orderNumber: candidate });
  if (exists) {
    return `MVS-${datePart}-${Date.now()}`;
  }
  return candidate;
}

module.exports = generateOrderNumber;

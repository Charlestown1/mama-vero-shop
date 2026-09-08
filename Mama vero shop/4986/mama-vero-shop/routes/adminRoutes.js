const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const adminController = require('../controllers/adminController');

// Every route below requires a logged-in ADMIN - enforced server-side,
// never merely hidden in the UI.
router.use(protect, adminOnly);

router.get('/overview', adminController.getOverview);

router.get('/products', adminController.getAllProducts);
router.post('/products', upload.single('image'), adminController.createProduct);
router.patch('/products/:id', upload.single('image'), adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

router.get('/customers', adminController.getCustomers);

router.get('/orders', adminController.getAllOrders);
router.get('/orders/:id', adminController.getOrderById);
router.get('/orders/:id/payment-proof-url', adminController.getPaymentProofUrl);
router.patch('/orders/:id/payment', adminController.updatePaymentStatus);
router.patch('/orders/:id/status', adminController.updateOrderStatus);

module.exports = router;

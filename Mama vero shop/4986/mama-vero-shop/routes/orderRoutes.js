const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const orderController = require('../controllers/orderController');

router.use(protect); // every order route requires a logged-in customer

router.post('/', orderController.createOrder);
router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.post('/:id/payment-proof', upload.single('paymentProof'), orderController.uploadPaymentProof);
router.get('/:id/payment-proof-url', orderController.getMyPaymentProofUrl);

module.exports = router;

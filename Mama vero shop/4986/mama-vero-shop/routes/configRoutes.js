const express = require('express');
const router = express.Router();

// Publicly exposes only the non-sensitive bank details needed to display
// payment instructions at checkout. Nothing secret lives here.
router.get('/bank-details', (req, res) => {
  res.json({
    success: true,
    bankDetails: {
      bankName: process.env.BANK_NAME || 'Not configured yet',
      accountName: process.env.BANK_ACCOUNT_NAME || 'Not configured yet',
      accountNumber: process.env.BANK_ACCOUNT_NUMBER || 'Not configured yet',
    },
  });
});

module.exports = router;

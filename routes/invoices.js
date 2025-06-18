const express = require('express');
const Invoice = require('../models/Invoice');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Protect all routes with auth middleware
router.use(authMiddleware);

// Create invoice: attach userId from the authenticated user
router.post('/', async (req, res) => {
  try {
    const invoiceData = {
      ...req.body,
      userId: req.user.id,  // add userId from token payload
    };

    const invoice = new Invoice(invoiceData);
    await invoice.save();
    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get invoices only for the authenticated user
router.get('/', async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user.id }); // filter by userId
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

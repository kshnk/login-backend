const express = require('express');
const Invoice = require('../models/Invoice');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Protect all routes with auth middleware
router.use(authMiddleware);

// Create invoice: from logged-in user to another user
router.post('/', async (req, res) => {
  try {
    const { toUserId, client, items, total, dueDate, poNumber, shipping, tax, gst } = req.body;


    if (!toUserId) {
      return res.status(400).json({ error: 'Recipient (toUserId) is required' });
    }

    const invoice = new Invoice({
      fromUser: req.user.id,
      toUser: toUserId,
      client,
      items,
      total,
      dueDate,
      poNumber,
      shipping,
      tax,
      gst,
      invoiceNumber: `INV-${Date.now()}` // optional: generate simple invoice number
    });


    await invoice.save();
    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get invoices
router.get('/', async (req, res) => {
  try {
    let invoices;

    if (req.user.role === 'admin') {
      // Admins can view all invoices
      invoices = await Invoice.find();
    } else {
      // Regular users see invoices they sent or received
      invoices = await Invoice.find({
        $or: [
          { fromUser: req.user.id },
          { toUser: req.user.id }
        ]
      });
    }

    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

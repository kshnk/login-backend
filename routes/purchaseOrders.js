const express = require('express');
const PurchaseOrder = require('../models/PurchaseOrder');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Create a PO
router.post('/', async (req, res) => {
  try {
    const { poNumber, vendorId, products } = req.body;

    const po = new PurchaseOrder({
      poNumber,
      createdBy: req.user.id,
      vendor: vendorId,
      products
    });

    await po.save();
    res.status(201).json(po);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all POs (for admin or created by user)
router.get('/', async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? {}
      : { $or: [{ createdBy: req.user.id }, { vendor: req.user.id }] };

    const pos = await PurchaseOrder.find(filter).populate('vendor').populate('createdBy');
    res.json(pos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

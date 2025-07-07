const express = require('express');
const Invoice = require('../models/Invoice');
const authMiddleware = require('../middleware/auth');
const PDFDocument = require('pdfkit');

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

// Route: GET /api/invoices/:id/pdf
router.get('/:id/pdf', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('fromUser', 'email role')
      .populate('toUser', 'email role');

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Optional: Only allow owner or recipient or admin
    if (
      req.user.role !== 'admin' &&
      invoice.fromUser._id.toString() !== req.user.id &&
      invoice.toUser._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=invoice-${invoice._id}.pdf`);

    // Create PDF stream
    const doc = new PDFDocument();
    doc.pipe(res);

    // === PDF content ===
    doc.fontSize(18).text(`Invoice #${invoice.invoiceNumber || invoice._id}`, { align: 'center' });
    doc.moveDown();
    doc.text(`From: ${invoice.fromUser.email}`);
    doc.text(`To: ${invoice.toUser.email}`);
    doc.text(`Client: ${invoice.client}`);
    doc.text(`PO Number: ${invoice.poNumber || 'N/A'}`);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`);
    doc.moveDown();

    doc.text('Items:', { underline: true });
    invoice.items.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.description} - Qty: ${item.quantity}, Price: $${item.price}`);
    });

    doc.moveDown();
    doc.text(`Shipping: $${invoice.shipping || 0}`);
    doc.text(`Tax: $${invoice.tax || 0}`);
    doc.text(`GST: $${invoice.gst || 0}`);
    doc.text(`Total: $${invoice.total}`, { bold: true });
    doc.text(`Status: ${invoice.status}`);

    doc.end(); // Finalize
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});


module.exports = router;

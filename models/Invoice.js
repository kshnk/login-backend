const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: String, required: true },
  items: [{
    description: String,
    quantity: Number,
    price: Number
  }],
  total: Number,
  dueDate: Date,
  status: { type: String, default: 'unpaid' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);

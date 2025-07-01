const mongoose = require('mongoose');

const PurchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // hospital
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true }
  }],
  status: { type: String, enum: ['pending', 'fulfilled', 'cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);

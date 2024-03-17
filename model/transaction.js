const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  From: String,
  To: String,
  Gasused: String,
  Value: String,
  TransactionHash: String 
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
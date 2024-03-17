const mongoose = require('mongoose');

const sanphamSchema = new mongoose.Schema({
  Name: String,
  Price: Number,
  Title: String,
  Des: String,
}, { timestamps: true });

const SanPham = mongoose.model('Sanpham', sanphamSchema);

module.exports = SanPham;
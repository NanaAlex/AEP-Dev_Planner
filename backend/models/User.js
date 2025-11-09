const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
  passwordHash: { type: String }
}, { timestamps: true });
module.exports = mongoose.model('User', schema);

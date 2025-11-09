const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fromStatus: String,
  toStatus: String,
  dataBefore: mongoose.Schema.Types.Mixed,
  dataAfter: mongoose.Schema.Types.Mixed
}, { timestamps: true });
schema.index({ taskId: 1 });
module.exports = mongoose.model('TaskHistory', schema);

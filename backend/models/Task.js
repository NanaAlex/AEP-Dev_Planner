const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: String,
  priority: { type: String, enum: ['Baixa','Média','Alta'], default: 'Baixa' },
  dueDate: Date,
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  status: { type: String, enum: ['todo','doing','review','done'], default: 'todo' }
}, { timestamps: true });
schema.index({ projectId: 1, status: 1 });
schema.index({ ownerId: 1 });
module.exports = mongoose.model('Task', schema);

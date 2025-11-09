const express = require('express');
const router = express.Router();
const Task = require('../models/task');
const TaskHistory = require('../models/taskHistory');

// listar (aceita ?status=done etc)
router.get('/', async (req,res)=>{
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const tasks = await Task.find(filter).populate('ownerId').populate('projectId');
  res.json(tasks);
});

// criar
router.post('/', async (req,res)=>{
  try {
    const { title, description, type, priority, dueDate, ownerId, projectId } = req.body;
    const task = await Task.create({ title, description, type, priority, dueDate, ownerId, projectId });
    await TaskHistory.create({ taskId: task._id, action:'Criar', performedBy: ownerId });
    res.status(201).json(task);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// atualizar completo
router.put('/:id', async (req,res)=>{
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new:true });
    await TaskHistory.create({ taskId: task._id, action:'Editar', performedBy: req.body.ownerId });
    res.json(task);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// atualizar status (patch)
router.patch('/:id/status', async (req,res)=>{
  try {
    const { status } = req.body;
    const prev = await Task.findById(req.params.id);
    const task = await Task.findByIdAndUpdate(req.params.id, { status }, { new:true });
    await TaskHistory.create({ taskId: task._id, action:'Mover', fromStatus: prev.status, toStatus: status, performedBy: req.body.performedBy });
    res.json(task);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// deletar
router.delete('/:id', async (req,res)=>{
  try {
    await Task.findByIdAndDelete(req.params.id);
    await TaskHistory.create({ taskId: req.params.id, action:'Excluir', performedBy: req.body.performedBy });
    res.json({ message: 'Deletado' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;

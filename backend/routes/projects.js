const express = require('express');
const router = express.Router();
const Project = require('../models/project');

router.get('/', async (req,res)=>{
  const projects = await Project.find().populate('ownerId');
  res.json(projects);
});

router.post('/', async (req,res)=>{
  try {
    const p = new Project(req.body);
    await p.save();
    res.json(p);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.get('/', async (req,res)=>{
  const { name } = req.query;
  if (name) {
    const users = await User.find({ name: new RegExp(name, 'i') });
    return res.json(users);
  }
  const users = await User.find();
  res.json(users);
});

router.post('/', async (req,res)=>{
  try {
    const user = new User(req.body);
    await user.save();
    res.json(user);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;

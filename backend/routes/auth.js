const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const JWT_SECRET = process.env.JWT_SECRET || 'troquenaoservidornovamente';

router.post('/register', async (req,res)=>{
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error:'Dados incompletos' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error:'Email já existe' });
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, passwordHash: hash });
    await user.save();
    const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, { expiresIn:'8h' });
    res.json({ token, user: { id:user._id, name:user.name, email:user.email }});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/login', async (req,res)=>{
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error:'Dados incompletos' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error:'Usuário não encontrado' });
    const ok = await bcrypt.compare(password, user.passwordHash || '');
    if (!ok) return res.status(401).json({ error:'Senha incorreta' });
    const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, { expiresIn:'8h' });
    res.json({ token, user: { id:user._id, name:user.name, email:user.email }});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

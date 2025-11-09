// backend/server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// === FRONTEND STATIC ===
// Ajuste conforme sua pasta AEP/frontend/html
app.use('/html', express.static(path.join(__dirname, '../frontend/html')));
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/script', express.static(path.join(__dirname, '../frontend/script')));

// === MOCK DATABASE ===
// Para testes rápidos sem MongoDB
let users = [];
let tasks = [];
let projects = [
  { id: 1, name: 'Trabalho' },
  { id: 2, name: 'AEP' },
  { id: 3, name: 'Projeto Exemplo' }
];

// === ROTAS API ===

// Registro de usuário
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos' });
  }

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email já cadastrado' });
  }

  const newUser = { id: users.length + 1, name, email, password };
  users.push(newUser);

  res.json({ message: 'Usuário criado com sucesso', user: newUser, token: 'token-exemplo' });
});

// Login de usuário
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Email ou senha incorretos' });

  res.json({ message: 'Login realizado', user, token: 'token-exemplo' });
});

// Lista de usuários
app.get('/api/users', (req, res) => {
  res.json(users);
});

// Lista de projetos (sem duplicados e ordenados)
app.get('/api/projects', (req, res) => {
  const seen = new Set();
  const unique = projects.filter(p => !seen.has(p.name.toLowerCase()) && seen.add(p.name.toLowerCase()));
  unique.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  res.json(unique);
});

// Criar projeto novo (opcional)
app.post('/api/projects', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

  const exists = projects.some(p => p.name.toLowerCase() === name.toLowerCase());
  if (exists) return res.status(409).json({ error: 'Projeto já existe' });

  const newProject = { id: projects.length + 1, name };
  projects.push(newProject);
  res.json(newProject);
});

// Lista de tarefas
app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

// Criar tarefa
app.post('/api/tasks', (req, res) => {
  const { title, desc, date, priority, type, owner, project } = req.body;
  if (!title) return res.status(400).json({ error: 'Título é obrigatório' });

  const newTask = {
    id: tasks.length + 1,
    title,
    desc,
    date,
    priority,
    type,
    owner,
    project,
    status: 'todo'
  };
  tasks.push(newTask);
  res.json(newTask);
});

// Editar tarefa
app.put('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const task = tasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });

  Object.assign(task, req.body);
  res.json(task);
});

// Deletar tarefa
app.delete('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  tasks = tasks.filter(t => t.id !== id);
  res.json({ message: 'Tarefa deletada' });
});

// Atualizar status da tarefa
app.patch('/api/tasks/:id/status', (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const task = tasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });

  task.status = status;
  res.json(task);
});

// === START SERVER ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server rodando na porta ${PORT}`));

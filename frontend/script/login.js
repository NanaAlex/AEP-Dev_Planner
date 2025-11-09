// script/login.js
const API = 'http://localhost:3000/api';

// ELEMENTOS
const loginCard = document.getElementById('login-card');
const registerCard = document.getElementById('register-card');
const loginMsg = document.getElementById('login-msg');
const registerMsg = document.getElementById('register-msg');

// MOSTRAR/OCULTAR FORMULÁRIOS
document.getElementById('show-register').addEventListener('click', () => {
  loginCard.style.display = 'none';
  registerCard.style.display = 'block';
});
document.getElementById('show-login').addEventListener('click', () => {
  registerCard.style.display = 'none';
  loginCard.style.display = 'block';
});

// LOGIN
document.getElementById('btn-login').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('devplanner_token', data.token);
      localStorage.setItem('devplanner_user', JSON.stringify(data.user));

      // Redirecionamento local
      window.location.href = 'file:///C:/Users/NanaDoGrau/Desktop/AEP_banckCompelto/AEP/frontend/html/kanban.html';
    } else {
      loginMsg.textContent = data.error || 'Erro ao fazer login';
      loginMsg.style.color = '#b3261e';
    }
  } catch (err) {
    console.error('Erro no login:', err);
    loginMsg.textContent = 'Erro de conexão com o servidor';
    loginMsg.style.color = '#b3261e';
  }
});

// REGISTRO
document.getElementById('btn-register').addEventListener('click', async () => {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value.trim();

  try {
    const res = await fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      registerMsg.textContent = 'Cadastro realizado com sucesso!';
      registerMsg.style.color = '#2f8a44';
      setTimeout(() => {
        registerCard.style.display = 'none';
        loginCard.style.display = 'block';
        registerMsg.textContent = '';
      }, 1500);
    } else {
      registerMsg.textContent = data.error || 'Erro ao registrar';
      registerMsg.style.color = '#b3261e';
    }
  } catch (err) {
    console.error('Erro ao registrar:', err);
    registerMsg.textContent = 'Erro de conexão com o servidor';
    registerMsg.style.color = '#b3261e';
  }
});

// LOGOUT (opcional, usado no kanban.js se necessário)
function logout() {
  localStorage.removeItem('devplanner_token');
  localStorage.removeItem('devplanner_user');
  window.location.href = 'file:///C:/Users/NanaDoGrau/Desktop/AEP_banckCompelto/AEP/frontend/html/login.html';
}

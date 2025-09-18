document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value.trim();

      try {
        const res = await fetch('http://localhost:5000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
          alert('Login sukses!');
          localStorage.setItem('user', JSON.stringify(data.user));
          window.location.href = 'index.html';
        } else {
          alert(data.error || 'Login gagal');
        }
      } catch (err) {
        console.error('Login error:', err);
        alert('Terjadi kesalahan saat login');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = registerForm.name.value.trim();
      const email = registerForm.email.value.trim();
      const password = registerForm.password.value.trim();

      try {
        const res = await fetch('http://localhost:5000/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (res.ok) {
          alert('Registrasi sukses! Silakan login.');
          toggleForms();
        } else {
          alert(data.message || 'Registrasi gagal');
        }
      } catch (err) {
        console.error('Register error:', err);
        alert('Terjadi kesalahan saat registrasi');
      }
    });
  }

  function toggleForms() {
    if (loginForm.style.display === 'none') {
      loginForm.style.display = 'flex';
      registerForm.style.display = 'none';
    } else {
      loginForm.style.display = 'none';
      registerForm.style.display = 'flex';
    }
  }
});

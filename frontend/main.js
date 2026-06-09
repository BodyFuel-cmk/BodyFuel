// Backend API base URL (proxied through Vite in dev)
const API_BASE = '/api';

// Mobile menu toggle
document.querySelector('.mobile-menu-btn')?.addEventListener('click', () => {
  document.querySelector('.nav-links')?.classList.toggle('active');
});

// Close mobile menu on link click
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector('.nav-links')?.classList.remove('active');
  });
});

// Auth-aware navigation — if logged in, point CTA to dashboard
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('bf_token');
  const navCta = document.querySelector('.nav-cta');
  if (token && navCta) {
    navCta.textContent = 'My Dashboard';
    navCta.href = '/dashboard.html';
  }
});

// Pricing button click handlers
document.querySelectorAll('[data-plan]').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const plan = btn.dataset.plan; // 'monthly' or 'yearly'

    btn.textContent = 'Redirecting...';
    btn.disabled = true;

    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('bf_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/create-checkout-session`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Unable to start checkout. Please ensure the backend server is running.\n\n' + err.message);
      btn.textContent = plan === 'monthly' ? 'Start Free Trial' : 'Get Annual Access';
      btn.disabled = false;
    }
  });
});

// Signup form handler — create account via auth API
document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const btn = document.getElementById('signup-btn');

  if (!email || !password) return;

  btn.textContent = 'Creating account...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      // Store token for authenticated requests
      localStorage.setItem('bf_token', data.token);
      localStorage.setItem('bf_user', JSON.stringify(data.user));

      // Redirect to dashboard
      window.location.href = '/dashboard.html';
    } else {
      alert(data.error || 'Failed to create account');
      btn.textContent = 'Start Free Trial';
      btn.disabled = false;
    }
  } catch (err) {
    console.error('Signup error:', err);
    alert('Unable to connect. Please ensure the backend server is running.');
    btn.textContent = 'Start Free Trial';
    btn.disabled = false;
  }
});

// Smooth scroll offset for fixed navbar
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});
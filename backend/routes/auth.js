const { v4: uuidv4 } = require('uuid');
const express = require('express');
const router = express.Router();

const { getDb } = require('../db');
const { hashPassword, verifyPassword, createToken, authMiddleware } = require('../auth');
const { sendWelcomeEmail } = require('../emails');

/**
 * POST /api/auth/signup
 * Body: { email, password, name? }
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = getDb();

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Create user
    const id = uuidv4();
    const passwordHash = await hashPassword(password);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name)
      VALUES (?, ?, ?, ?)
    `).run(id, email.toLowerCase(), passwordHash, name || '');

    const user = { id, email: email.toLowerCase(), name: name || '' };

    // Send welcome email (async, don't block response)
    sendWelcomeEmail(user).catch(err => {
      console.error('[Email] Failed to send welcome:', err.message);
    });

    // Create JWT
    const token = createToken(user);

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user,
    });
  } catch (err) {
    console.error('[Auth/Signup]', err.message);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDb();
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());

    if (!row) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await verifyPassword(password, row.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = { id: row.id, email: row.email, name: row.name };
    const token = createToken(user);

    res.json({ token, user });
  } catch (err) {
    console.error('[Auth/Login]', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 * Requires: Authorization: Bearer <token>
 */
router.get('/me', authMiddleware, (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT id, email, name, stripe_customer_id, subscription_status, subscription_plan, created_at FROM users WHERE id = ?').get(req.user.sub);

  if (!row) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user: row });
});

module.exports = router;
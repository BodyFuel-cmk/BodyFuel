require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const stripeRoutes = require('./routes/stripe');
const webhookRoutes = require('./routes/webhook');
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Stripe webhook needs raw body — mount BEFORE express.json()
app.use('/api/webhook', webhookRoutes);

// Standard middleware
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

// Serve success/cancel pages
app.use(express.static(path.join(__dirname, 'public')));

// Stripe checkout routes
app.use('/api', stripeRoutes);

// Auth routes
app.use('/api/auth', authRoutes);

// Video routes
app.use('/api/videos', videoRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BodyFuel TV API running on http://0.0.0.0:${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
});
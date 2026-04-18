const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import DB connection
const connectDB = require('./config/db');

// Import routes
const syncRoutes = require('./routes/sync');
const productRoutes = require('./routes/products');
const billRoutes = require('./routes/bills');
const dashboardRoutes = require('./routes/dashboard');
const settingsRoutes = require('./routes/settings');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Initialize Express
const app = express();

let dbReadyPromise;

// ─── MIDDLEWARE ───────────────────────────────────────
// Security headers
app.use(helmet());

// CORS — allow Flutter app to connect
app.use(cors({
  origin: '*', // In production, restrict to your app's domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Parse JSON bodies
// Increased limit because sync push can send large batches
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure database is connected before handling API requests in serverless mode.
app.use('/api', async (req, res, next) => {
  try {
    if (!dbReadyPromise) {
      dbReadyPromise = connectDB();
    }
    await dbReadyPromise;
    next();
  } catch (error) {
    next(error);
  }
});

// ─── ROUTES ──────────────────────────────────────────
// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Billing server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/sync', syncRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// ─── START SERVER ────────────────────────────────────
const PORT = process.env.PORT || 3000;

const isVercel = process.env.VERCEL === '1';

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Billing server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

if (!isVercel) {
  startServer();
}

module.exports = app;
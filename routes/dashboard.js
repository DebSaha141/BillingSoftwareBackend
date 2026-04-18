const express = require('express');
const router = express.Router();
const {
  getTodaySummary,
  getDailySummary,
  getMonthlySummary,
  getOverview,
} = require('../controllers/dashboardController');

// GET /api/dashboard/overview — Quick stats for home screen
router.get('/overview', getOverview);

// GET /api/dashboard/today — Today's detailed summary
router.get('/today', getTodaySummary);

// GET /api/dashboard/daily?date=2025-06-12 — Specific day
router.get('/daily', getDailySummary);

// GET /api/dashboard/monthly?year=2025&month=6 — Monthly breakdown
router.get('/monthly', getMonthlySummary);

module.exports = router;
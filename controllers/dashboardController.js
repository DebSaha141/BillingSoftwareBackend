const Bill = require('../models/Bill');
const Product = require('../models/Product');
const { getDayRange, getMonthRange } = require('../utils/helpers');

/**
 * Dashboard endpoints provide aggregated data.
 * These are primarily for the Flutter app's dashboard screen.
 * 
 * The app CAN compute these locally from Isar for recent data,
 * but these endpoints serve as verification + handle historical data
 * that might not be stored locally.
 */

// GET /api/dashboard/today
const getTodaySummary = async (req, res, next) => {
  try {
    const { start, end } = getDayRange(new Date());

    const result = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$grandTotal' },
          totalBills: { $count: {} },
          averageBillValue: { $avg: '$grandTotal' },
          totalDiscount: { $sum: '$discountAmount' },
          totalTax: { $sum: '$taxAmount' },
          cashSales: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$grandTotal', 0],
            },
          },
          upiSales: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'upi'] }, '$grandTotal', 0],
            },
          },
          cardSales: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'card'] }, '$grandTotal', 0],
            },
          },
        },
      },
    ]);

    const summary = result[0] || {
      totalSales: 0,
      totalBills: 0,
      averageBillValue: 0,
      totalDiscount: 0,
      totalTax: 0,
      cashSales: 0,
      upiSales: 0,
      cardSales: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        date: start.toISOString().split('T')[0],
        ...summary,
        _id: undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/daily?date=2025-06-12
const getDailySummary = async (req, res, next) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const { start, end } = getDayRange(date);

    const result = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$grandTotal' },
          totalBills: { $count: {} },
          averageBillValue: { $avg: '$grandTotal' },
          totalDiscount: { $sum: '$discountAmount' },
          totalTax: { $sum: '$taxAmount' },
          cashSales: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$grandTotal', 0],
            },
          },
          upiSales: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'upi'] }, '$grandTotal', 0],
            },
          },
          cardSales: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'card'] }, '$grandTotal', 0],
            },
          },
        },
      },
    ]);

    const summary = result[0] || {
      totalSales: 0,
      totalBills: 0,
      averageBillValue: 0,
      totalDiscount: 0,
      totalTax: 0,
      cashSales: 0,
      upiSales: 0,
      cardSales: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        date: start.toISOString().split('T')[0],
        ...summary,
        _id: undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/monthly?year=2025&month=6
const getMonthlySummary = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const { start, end } = getMonthRange(year, month - 1); // 0-indexed

    // Daily breakdown for the month
    const dailyBreakdown = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: '$grandTotal' },
          totalBills: { $count: {} },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Monthly totals
    const monthlyTotal = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$grandTotal' },
          totalBills: { $count: {} },
          averageBillValue: { $avg: '$grandTotal' },
          totalDiscount: { $sum: '$discountAmount' },
          totalTax: { $sum: '$taxAmount' },
          cashSales: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$grandTotal', 0],
            },
          },
          upiSales: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'upi'] }, '$grandTotal', 0],
            },
          },
          cardSales: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'card'] }, '$grandTotal', 0],
            },
          },
        },
      },
    ]);

    const summary = monthlyTotal[0] || {
      totalSales: 0,
      totalBills: 0,
      averageBillValue: 0,
      totalDiscount: 0,
      totalTax: 0,
      cashSales: 0,
      upiSales: 0,
      cardSales: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        year,
        month,
        summary: { ...summary, _id: undefined },
        dailyBreakdown: dailyBreakdown.map((d) => ({
          date: d._id,
          totalSales: d.totalSales,
          totalBills: d.totalBills,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/overview
// Quick stats for the dashboard home
const getOverview = async (req, res, next) => {
  try {
    const { start: todayStart, end: todayEnd } = getDayRange(new Date());

    // Today's totals
    const todayResult = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart, $lte: todayEnd },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$grandTotal' },
          totalBills: { $count: {} },
        },
      },
    ]);

    // This month's totals
    const now = new Date();
    const { start: monthStart, end: monthEnd } = getMonthRange(
      now.getFullYear(),
      now.getMonth()
    );

    const monthResult = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: monthStart, $lte: monthEnd },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$grandTotal' },
          totalBills: { $count: {} },
        },
      },
    ]);

    // Product count
    const productCount = await Product.countDocuments({ isDeleted: false });

    // Last 7 days trend
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekTrend = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: '$grandTotal' },
          totalBills: { $count: {} },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const today = todayResult[0] || { totalSales: 0, totalBills: 0 };
    const month = monthResult[0] || { totalSales: 0, totalBills: 0 };

    res.status(200).json({
      success: true,
      data: {
        today: {
          totalSales: today.totalSales,
          totalBills: today.totalBills,
        },
        thisMonth: {
          totalSales: month.totalSales,
          totalBills: month.totalBills,
        },
        totalProducts: productCount,
        weekTrend: weekTrend.map((d) => ({
          date: d._id,
          totalSales: d.totalSales,
          totalBills: d.totalBills,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTodaySummary,
  getDailySummary,
  getMonthlySummary,
  getOverview,
};
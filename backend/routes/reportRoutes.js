const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Cashiers can access basic dashboard counts (e.g. today's orders & low-stock count for operational awareness),
// but detailed financial reports are Admin-only.
// Let's create an operational summary endpoint for Cashiers, and detailed analytics for Admin.

// @desc    Dashboard overview (Today's summary)
// @route   GET /api/reports/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Completed orders today
    const todayCompletedOrders = await Order.find({
      status: 'Completed',
      completedAt: { $gte: todayStart, $lte: todayEnd },
    });

    const todaySales = todayCompletedOrders.reduce((sum, ord) => sum + ord.grandTotal, 0);

    // Calculate total cost and profit for today
    let todayCost = 0;
    todayCompletedOrders.forEach((ord) => {
      ord.items.forEach((item) => {
        todayCost += (item.costPrice || 0) * item.quantity;
      });
    });
    const todayProfit = todaySales - todayCost;

    // Counts
    const todayTotalOrdersCount = await Order.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    const pendingOrdersCount = await Order.countDocuments({ status: 'Pending' });

    const totalMenuItems = await MenuItem.countDocuments();
    const availableMenuItems = await MenuItem.countDocuments({ isAvailable: true });

    // Low stock items: where stockQuantity <= lowStockThreshold
    const lowStockItems = await MenuItem.find({
      $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
    }).populate('category', 'name icon');

    // Recent 5 orders
    const recentOrders = await Order.find()
      .populate('cashier', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        todaySales: Number(todaySales.toFixed(2)),
        todayCost: Number(todayCost.toFixed(2)),
        todayProfit: Number(todayProfit.toFixed(2)),
        todayOrdersCount: todayTotalOrdersCount,
        todayCompletedCount: todayCompletedOrders.length,
        pendingOrdersCount,
        totalMenuItems,
        availableMenuItems,
        lowStockCount: lowStockItems.length,
        lowStockItems,
        recentOrders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// All following analytics endpoints require Admin role
router.use(authorize('admin'));

// @desc    Sales reports (Daily, Weekly, Monthly)
// @route   GET /api/reports/sales
router.get('/sales', async (req, res) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;

    let start = new Date();
    let end = new Date();
    end.setHours(23, 59, 59, 999);

    if (startDate && endDate) {
      start = new Date(new Date(startDate).setHours(0, 0, 0, 0));
      end = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    } else if (period === 'daily') {
      // Last 7 days
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      // Last 4 weeks
      start.setDate(start.getDate() - 28);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
      // Last 6 months
      start.setMonth(start.getMonth() - 6);
      start.setHours(0, 0, 0, 0);
    }

    const orders = await Order.find({
      status: 'Completed',
      completedAt: { $gte: start, $lte: end },
    }).populate('cashier', 'name username');

    // Aggregate by date
    const dateMap = {};
    let totalRevenue = 0;
    let totalCost = 0;
    let totalDiscounts = 0;
    let totalTaxes = 0;

    orders.forEach((ord) => {
      const dKey = ord.completedAt ? ord.completedAt.toISOString().slice(0, 10) : ord.createdAt.toISOString().slice(0, 10);
      if (!dateMap[dKey]) {
        dateMap[dKey] = {
          date: dKey,
          revenue: 0,
          cost: 0,
          profit: 0,
          ordersCount: 0,
          discounts: 0,
        };
      }

      dateMap[dKey].revenue += ord.grandTotal;
      dateMap[dKey].ordersCount += 1;
      dateMap[dKey].discounts += ord.discountAmount || 0;

      totalRevenue += ord.grandTotal;
      totalDiscounts += ord.discountAmount || 0;
      totalTaxes += ord.taxAmount || 0;

      let ordCost = 0;
      ord.items.forEach((it) => {
        ordCost += (it.costPrice || 0) * it.quantity;
      });
      dateMap[dKey].cost += ordCost;
      dateMap[dKey].profit += ord.grandTotal - ordCost;
      totalCost += ordCost;
    });

    const breakdown = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      summary: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        netProfit: Number((totalRevenue - totalCost).toFixed(2)),
        totalOrders: orders.length,
        averageOrderValue: orders.length ? Number((totalRevenue / orders.length).toFixed(2)) : 0,
        totalDiscounts: Number(totalDiscounts.toFixed(2)),
        totalTaxes: Number(totalTaxes.toFixed(2)),
        dateRange: { start, end },
      },
      breakdown,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Sales by Cashier report
// @route   GET /api/reports/cashiers
router.get('/cashiers', async (req, res) => {
  try {
    const orders = await Order.find({ status: 'Completed' }).populate('cashier', 'name username');

    const cashierMap = {};

    orders.forEach((ord) => {
      const cId = ord.cashier ? ord.cashier._id.toString() : 'unknown';
      const cName = ord.cashierName || (ord.cashier ? ord.cashier.name : 'Unknown');

      if (!cashierMap[cId]) {
        cashierMap[cId] = {
          cashierId: cId,
          cashierName: cName,
          totalSales: 0,
          orderCount: 0,
          itemsSold: 0,
        };
      }

      cashierMap[cId].totalSales += ord.grandTotal;
      cashierMap[cId].orderCount += 1;
      const count = ord.items.reduce((acc, it) => acc + it.quantity, 0);
      cashierMap[cId].itemsSold += count;
    });

    const list = Object.values(cashierMap).sort((a, b) => b.totalSales - a.totalSales);

    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Most sold menu items (Top products)
// @route   GET /api/reports/top-items
router.get('/top-items', async (req, res) => {
  try {
    const orders = await Order.find({ status: 'Completed' });

    const itemMap = {};

    orders.forEach((ord) => {
      ord.items.forEach((it) => {
        const id = it.menuItem ? it.menuItem.toString() : it.name;
        if (!itemMap[id]) {
          itemMap[id] = {
            name: it.name,
            quantitySold: 0,
            totalRevenue: 0,
            totalProfit: 0,
          };
        }
        itemMap[id].quantitySold += it.quantity;
        itemMap[id].totalRevenue += it.subtotal;
        const profit = it.subtotal - (it.costPrice || 0) * it.quantity;
        itemMap[id].totalProfit += profit;
      });
    });

    const topItems = Object.values(itemMap)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 15);

    res.json({ success: true, data: topItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Cancelled orders report
// @route   GET /api/reports/cancelled
router.get('/cancelled', async (req, res) => {
  try {
    const cancelled = await Order.find({ status: 'Cancelled' })
      .populate('cashier', 'name username')
      .populate('table', 'tableNumber')
      .sort({ updatedAt: -1 });

    const totalLostRevenue = cancelled.reduce((sum, ord) => sum + ord.grandTotal, 0);

    res.json({
      success: true,
      count: cancelled.length,
      totalLostRevenue: Number(totalLostRevenue.toFixed(2)),
      data: cancelled,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

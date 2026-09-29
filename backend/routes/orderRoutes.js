const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const { protect } = require('../middleware/auth');

router.use(protect);

// Helper function to generate unique order number
const generateOrderNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const countToday = await Order.countDocuments({
    createdAt: { $gte: startOfDay },
  });

  const seq = String(countToday + 1).padStart(4, '0');
  return `ORD-${dateStr}-${seq}`;
};

// @desc    Get all orders (with filters)
// @route   GET /api/orders
router.get('/', async (req, res) => {
  try {
    const { status, cashierId, date, startDate, endDate, orderType, limit } = req.query;
    let query = {};

    // Cashiers only see orders if needed, or cashiers can view today's orders/their orders
    if (req.user.role === 'cashier' && req.query.myOnly === 'true') {
      query.cashier = req.user._id;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (cashierId && cashierId !== 'all') {
      query.cashier = cashierId;
    }

    if (orderType && orderType !== 'all') {
      query.orderType = orderType;
    }

    if (date) {
      const d = new Date(date);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      query.createdAt = { $gte: start, $lte: end };
    } else if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(new Date(startDate).setHours(0, 0, 0, 0));
      if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const maxLimit = limit ? parseInt(limit) : 200;
    const orders = await Order.find(query)
      .populate('cashier', 'name username')
      .populate('table', 'tableNumber')
      .sort({ createdAt: -1 })
      .limit(maxLimit);

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single order
// @route   GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('cashier', 'name username')
      .populate('table', 'tableNumber capacity');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create new order (with optional instant payment)
// @route   POST /api/orders
router.post('/', async (req, res) => {
  try {
    const {
      orderType,
      tableId,
      items,
      discountPercent = 0,
      taxPercent = 0,
      isPaidNow = false,
      amountPaid = 0,
      paymentMethod = 'Cash',
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    // Verify items and calculate pricing
    const orderItems = [];
    let subtotal = 0;

    for (const it of items) {
      const menuItem = await MenuItem.findById(it.menuItemId || it._id);
      if (!menuItem) {
        return res.status(400).json({ success: false, message: `Menu item not found: ${it.name || it._id}` });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({ success: false, message: `Item "${menuItem.name}" is currently unavailable` });
      }

      if (menuItem.stockQuantity < it.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${menuItem.name}". Available: ${menuItem.stockQuantity}, Requested: ${it.quantity}`,
        });
      }

      const itemSubtotal = menuItem.price * it.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        costPrice: menuItem.costPrice || 0,
        quantity: it.quantity,
        subtotal: itemSubtotal,
        notes: it.notes || '',
      });
    }

    // Calculate totals
    const discPct = Math.max(0, Math.min(100, Number(discountPercent) || 0));
    const discountAmount = Number(((subtotal * discPct) / 100).toFixed(2));
    const afterDiscount = Math.max(0, subtotal - discountAmount);

    const taxPct = Math.max(0, Number(taxPercent) || 0);
    const taxAmount = Number(((afterDiscount * taxPct) / 100).toFixed(2));
    const grandTotal = Number((afterDiscount + taxAmount).toFixed(2));

    let tableDoc = null;
    let tableNumber = '';

    if (orderType === 'Dine-In' && tableId) {
      tableDoc = await Table.findById(tableId);
      if (tableDoc) {
        tableNumber = tableDoc.tableNumber;
      }
    }

    const orderNumber = await generateOrderNumber();

    // Check payment
    let changeGiven = 0;
    let orderStatus = 'Pending';
    let paidAmt = Number(amountPaid) || 0;

    if (isPaidNow) {
      if (paidAmt < grandTotal) {
        return res.status(400).json({
          success: false,
          message: `Amount paid (${paidAmt.toFixed(2)}) is less than total (${grandTotal.toFixed(2)})`,
        });
      }
      changeGiven = Number((paidAmt - grandTotal).toFixed(2));
      orderStatus = 'Completed';
    }

    const order = new Order({
      orderNumber,
      orderType: orderType || 'Dine-In',
      table: tableDoc ? tableDoc._id : null,
      tableNumber,
      cashier: req.user._id,
      cashierName: req.user.name,
      items: orderItems,
      subtotal: Number(subtotal.toFixed(2)),
      discountPercent: discPct,
      discountAmount,
      taxPercent: taxPct,
      taxAmount,
      grandTotal,
      paymentMethod,
      amountPaid: isPaidNow ? paidAmt : 0,
      changeGiven: isPaidNow ? changeGiven : 0,
      status: orderStatus,
      completedAt: isPaidNow ? new Date() : null,
    });

    await order.save();

    // Deduct stock if completed
    if (orderStatus === 'Completed') {
      for (const it of orderItems) {
        await MenuItem.findByIdAndUpdate(it.menuItem, {
          $inc: { stockQuantity: -it.quantity },
        });
      }
      // If table was linked, clear table or set table available
      if (tableDoc) {
        tableDoc.status = 'Available';
        tableDoc.currentOrder = null;
        await tableDoc.save();
      }
    } else {
      // Pending order: if table was assigned, mark table Occupied and link order
      if (tableDoc) {
        tableDoc.status = 'Occupied';
        tableDoc.currentOrder = order._id;
        await tableDoc.save();
      }
    }

    res.status(201).json({
      success: true,
      message: `Order ${orderNumber} created successfully`,
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Process payment for pending order
// @route   PUT /api/orders/:id/pay
router.put('/:id/pay', async (req, res) => {
  try {
    const { amountPaid, paymentMethod = 'Cash' } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Order is already completed' });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot pay for a cancelled order' });
    }

    const paidAmt = Number(amountPaid);
    if (isNaN(paidAmt) || paidAmt < order.grandTotal) {
      return res.status(400).json({
        success: false,
        message: `Amount paid (${paidAmt || 0}) must be at least total (${order.grandTotal})`,
      });
    }

    // Deduct stock for all items
    for (const it of order.items) {
      await MenuItem.findByIdAndUpdate(it.menuItem, {
        $inc: { stockQuantity: -it.quantity },
      });
    }

    order.paymentMethod = paymentMethod;
    order.amountPaid = paidAmt;
    order.changeGiven = Number((paidAmt - order.grandTotal).toFixed(2));
    order.status = 'Completed';
    order.completedAt = new Date();
    await order.save();

    // Release table if occupied
    if (order.table) {
      await Table.findByIdAndUpdate(order.table, {
        status: 'Available',
        currentOrder: null,
      });
    }

    res.json({
      success: true,
      message: `Payment processed for order ${order.orderNumber}`,
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
router.put('/:id/cancel', async (req, res) => {
  try {
    const { cancellationReason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    }

    // If order was already completed, restore stock
    if (order.status === 'Completed') {
      for (const it of order.items) {
        await MenuItem.findByIdAndUpdate(it.menuItem, {
          $inc: { stockQuantity: it.quantity },
        });
      }
    }

    order.status = 'Cancelled';
    order.cancellationReason = cancellationReason || 'Customer requested cancellation';
    await order.save();

    // Release table if linked
    if (order.table) {
      await Table.findByIdAndUpdate(order.table, {
        status: 'Available',
        currentOrder: null,
      });
    }

    res.json({
      success: true,
      message: `Order ${order.orderNumber} cancelled`,
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

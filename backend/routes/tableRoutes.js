const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// @desc    Get all tables
// @route   GET /api/tables
router.get('/', async (req, res) => {
  try {
    const tables = await Table.find().populate('currentOrder', 'orderNumber grandTotal status items').sort({ tableNumber: 1 });
    res.json({ success: true, count: tables.length, data: tables });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create new table (Admin only)
// @route   POST /api/tables
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { tableNumber, capacity, notes } = req.body;
    if (!tableNumber) {
      return res.status(400).json({ success: false, message: 'Table number/name is required' });
    }

    const existing = await Table.findOne({ tableNumber: tableNumber.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Table with this number already exists' });
    }

    const table = await Table.create({
      tableNumber: tableNumber.trim(),
      capacity: Number(capacity) || 4,
      notes: notes || '',
      status: 'Available',
    });

    res.status(201).json({ success: true, message: 'Table created', data: table });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update table (Admin only)
// @route   PUT /api/tables/:id
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const { tableNumber, capacity, notes, status } = req.body;
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    if (tableNumber) table.tableNumber = tableNumber.trim();
    if (capacity) table.capacity = Number(capacity);
    if (notes !== undefined) table.notes = notes;
    if (status) table.status = status;

    await table.save();
    res.json({ success: true, message: 'Table updated', data: table });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update table status (Admin or Cashier)
// @route   PATCH /api/tables/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, currentOrder } = req.body;
    const validStatuses = ['Available', 'Occupied', 'Reserved'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid table status' });
    }

    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    table.status = status;
    if (status === 'Available') {
      table.currentOrder = null;
    } else if (currentOrder !== undefined) {
      table.currentOrder = currentOrder;
    }

    await table.save();
    res.json({ success: true, message: 'Table status updated', data: table });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete table (Admin only)
// @route   DELETE /api/tables/:id
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    if (table.status === 'Occupied') {
      return res.status(400).json({ success: false, message: 'Cannot delete table while it is occupied' });
    }

    await Table.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Table deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

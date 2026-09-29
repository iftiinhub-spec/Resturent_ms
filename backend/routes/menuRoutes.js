const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// @desc    Get all menu items (optional filters: category, search, available)
// @route   GET /api/menu
router.get('/', async (req, res) => {
  try {
    const { category, search, availableOnly } = req.query;
    let query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (availableOnly === 'true') {
      query.isAvailable = true;
    }

    const items = await MenuItem.find(query).populate('category', 'name icon').sort({ name: 1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single menu item
// @route   GET /api/menu/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id).populate('category', 'name icon');
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create new menu item (Admin only)
// @route   POST /api/menu
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { name, code, category, description, price, costPrice, stockQuantity, lowStockThreshold, isAvailable, imageEmoji } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({ success: false, message: 'Name, price, and category are required' });
    }

    const catDoc = await Category.findById(category);
    if (!catDoc) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    const newItem = await MenuItem.create({
      name: name.trim(),
      code: code ? code.trim().toUpperCase() : '',
      category,
      categoryName: catDoc.name,
      description: description || '',
      price: Number(price),
      costPrice: Number(costPrice || 0),
      stockQuantity: Number(stockQuantity || 0),
      lowStockThreshold: Number(lowStockThreshold || 5),
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      imageEmoji: imageEmoji || '🍽️',
    });

    res.status(201).json({ success: true, message: 'Menu item created successfully', data: newItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update menu item (Admin only)
// @route   PUT /api/menu/:id
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const { name, code, category, description, price, costPrice, stockQuantity, lowStockThreshold, isAvailable, imageEmoji } = req.body;
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    if (category && category !== item.category.toString()) {
      const catDoc = await Category.findById(category);
      if (catDoc) {
        item.category = category;
        item.categoryName = catDoc.name;
      }
    }

    if (name) item.name = name.trim();
    if (code !== undefined) item.code = code.trim().toUpperCase();
    if (description !== undefined) item.description = description;
    if (price !== undefined) item.price = Number(price);
    if (costPrice !== undefined) item.costPrice = Number(costPrice);
    if (stockQuantity !== undefined) item.stockQuantity = Number(stockQuantity);
    if (lowStockThreshold !== undefined) item.lowStockThreshold = Number(lowStockThreshold);
    if (isAvailable !== undefined) item.isAvailable = isAvailable;
    if (imageEmoji) item.imageEmoji = imageEmoji;

    await item.save();

    res.json({ success: true, message: 'Menu item updated successfully', data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Toggle availability (Admin only)
// @route   PATCH /api/menu/:id/toggle-availability
router.patch('/:id/toggle-availability', authorize('admin'), async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.json({ success: true, message: `Item marked as ${item.isAvailable ? 'available' : 'unavailable'}`, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Adjust stock (Admin only)
// @route   PATCH /api/menu/:id/stock
router.patch('/:id/stock', authorize('admin'), async (req, res) => {
  try {
    const { adjustment, newQuantity } = req.body;
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    if (newQuantity !== undefined) {
      item.stockQuantity = Math.max(0, Number(newQuantity));
    } else if (adjustment !== undefined) {
      item.stockQuantity = Math.max(0, item.stockQuantity + Number(adjustment));
    }

    await item.save();

    res.json({ success: true, message: 'Stock updated', data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete menu item (Admin only)
// @route   DELETE /api/menu/:id
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

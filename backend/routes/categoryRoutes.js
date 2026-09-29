const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// @desc    Get all categories
// @route   GET /api/categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create category (Admin only)
// @route   POST /api/categories
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const exists = await Category.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || '',
      icon: icon || 'Utensils',
    });

    res.status(201).json({ success: true, message: 'Category created', data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update category (Admin only)
// @route   PUT /api/categories/:id
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const { name, description, icon, isActive } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description;
    if (icon) category.icon = icon;
    if (typeof isActive === 'boolean') category.isActive = isActive;

    await category.save();

    // If name changed, update categoryName in MenuItem collection
    if (name) {
      await MenuItem.updateMany({ category: category._id }, { categoryName: category.name });
    }

    res.json({ success: true, message: 'Category updated', data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete category (Admin only)
// @route   DELETE /api/categories/:id
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const itemsCount = await MenuItem.countDocuments({ category: req.params.id });
    if (itemsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category: ${itemsCount} menu items are currently assigned to it. Reassign or delete the items first.`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

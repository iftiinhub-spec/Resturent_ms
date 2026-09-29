const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// All routes here are Admin-only
router.use(protect);
router.use(authorize('admin'));

// @desc    Get all users
// @route   GET /api/users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create new user (admin or cashier)
// @route   POST /api/users
router.post('/', async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ success: false, message: 'Username, password, and name are required' });
    }

    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    const newUser = await User.create({
      username: username.toLowerCase().trim(),
      password,
      name: name.trim(),
      role: role || 'cashier',
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: newUser._id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update user details
// @route   PUT /api/users/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, role, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent admin from deactivating or demoting themselves
    if (user._id.toString() === req.user._id.toString()) {
      if (isActive === false) {
        return res.status(400).json({ success: false, message: 'You cannot deactivate your own admin account' });
      }
      if (role && role !== 'admin') {
        return res.status(400).json({ success: false, message: 'You cannot remove your own admin privileges' });
      }
    }

    if (name) user.name = name.trim();
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        _id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Admin reset user password
// @route   PUT /api/users/:id/reset-password
router.put('/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: `Password reset successfully for ${user.username}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect('mongodb://127.0.0.1:27017/offline_restaurant_db').then(async () => {
  const users = await User.find();
  console.log('Total users:', users.length);
  for (const u of users) {
    console.log('Username:', u.username, 'Role:', u.role, 'Active:', u.isActive);
    const testAdmin = await u.matchPassword('admin123');
    const testCashier = await u.matchPassword('cashier123');
    console.log('Match admin123:', testAdmin, 'Match cashier123:', testCashier);
  }
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
